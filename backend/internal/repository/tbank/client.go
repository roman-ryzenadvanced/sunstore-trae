package tbank

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"sunstore/internal/config"
	"sunstore/internal/domain"
	"sunstore/internal/usecase"
)

// Client is a minimal T-Bank Internet Acquiring adapter for the Init method.
type Client struct {
	httpClient      *http.Client
	logger          *slog.Logger
	baseURL         string
	terminalKey     string
	password        string
	notificationURL string
	successURL      string
	failURL         string
}

// NewClient constructs a production-facing T-Bank acquiring client.
func NewClient(cfg config.TBankConfig, logger *slog.Logger) *Client {
	baseURL := strings.TrimRight(cfg.APIBaseURL, "/")
	return &Client{
		httpClient: &http.Client{
			Timeout: cfg.InitTimeout,
		},
		logger:          logger,
		baseURL:         baseURL,
		terminalKey:     cfg.TerminalKey,
		password:        cfg.Password,
		notificationURL: cfg.NotificationURL,
		successURL:      cfg.ReturnURL,
		failURL:         cfg.FailureURL,
	}
}

type initRequest struct {
	TerminalKey     string            `json:"TerminalKey"`
	Amount          int64             `json:"Amount"`
	OrderID         string            `json:"OrderId"`
	Description     string            `json:"Description,omitempty"`
	Language        string            `json:"Language,omitempty"`
	NotificationURL string            `json:"NotificationURL,omitempty"`
	SuccessURL      string            `json:"SuccessURL,omitempty"`
	FailURL         string            `json:"FailURL,omitempty"`
	PayType         string            `json:"PayType,omitempty"`
	Data            map[string]string `json:"DATA,omitempty"`
	Token           string            `json:"Token"`
}

type initResponse struct {
	Success     bool            `json:"Success"`
	ErrorCode   string          `json:"ErrorCode"`
	Message     string          `json:"Message"`
	Details     string          `json:"Details"`
	TerminalKey string          `json:"TerminalKey"`
	Status      string          `json:"Status"`
	PaymentID   string          `json:"PaymentId"`
	OrderID     string          `json:"OrderId"`
	Amount      int64           `json:"Amount"`
	PaymentURL  string          `json:"PaymentURL"`
	Raw         json.RawMessage `json:"-"`
}

// InitPayment calls /v2/Init and returns a stable gateway result.
func (c *Client) InitPayment(ctx context.Context, input usecase.PaymentInitRequest) (*usecase.PaymentInitResult, error) {
	payload := map[string]any{
		"TerminalKey":     c.terminalKey,
		"Amount":          input.AmountKopecks,
		"OrderId":         input.TBankOrderID,
		"Description":     truncate(input.Description, 140),
		"Language":        "ru",
		"NotificationURL": c.notificationURL,
		"SuccessURL":      c.successURL,
		"FailURL":         c.failURL,
		"PayType":         "O",
		"DATA": map[string]string{
			"email": input.CustomerEmail,
			"phone": input.CustomerPhone,
		},
	}
	payload["Token"] = BuildRequestToken(payload, c.password)

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal tbank init request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/Init", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create tbank init request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: tbank init http request failed: %v", domain.ErrUnavailable, err)
	}
	defer resp.Body.Close()

	var decoded initResponse
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return nil, fmt.Errorf("%w: decode tbank init response: %v", domain.ErrUnavailable, err)
	}
	raw, _ := json.Marshal(decoded)
	decoded.Raw = raw

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: tbank init returned status %d", domain.ErrUnavailable, resp.StatusCode)
	}
	if !decoded.Success || decoded.ErrorCode != "0" {
		message := strings.TrimSpace(decoded.Message + " " + decoded.Details)
		if message == "" {
			message = "payment initialization failed"
		}
		return nil, fmt.Errorf("%w: %s", domain.ErrUnavailable, message)
	}
	if decoded.PaymentURL == "" {
		return nil, fmt.Errorf("%w: missing payment url in tbank response", domain.ErrUnavailable)
	}

	c.logger.Info("tbank payment initialized",
		slog.String("order_id", input.TBankOrderID),
		slog.String("payment_id", decoded.PaymentID),
		slog.String("status", decoded.Status),
	)

	return &usecase.PaymentInitResult{
		PaymentURL: decoded.PaymentURL,
		PaymentID:  decoded.PaymentID,
		Raw:        decoded.Raw,
	}, nil
}

func truncate(value string, max int) string {
	value = strings.TrimSpace(value)
	if len(value) <= max {
		return value
	}
	return value[:max]
}

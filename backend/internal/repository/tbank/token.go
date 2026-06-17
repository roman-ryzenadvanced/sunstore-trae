package tbank

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

var (
	// ErrInvalidNotificationToken is returned when a callback signature does not match.
	ErrInvalidNotificationToken = errors.New("invalid tbank notification token")
)

// Notifier verifies incoming T-Bank callbacks.
type Notifier struct {
	password string
}

// NewNotifier constructs a notification verifier.
func NewNotifier(password string) *Notifier {
	return &Notifier{password: password}
}

// VerifyNotificationToken validates the callback Token. It accepts both the
// current documented algorithm and a legacy/prompt variant that omits Success.
func (n *Notifier) VerifyNotificationToken(payload map[string]any) error {
	token, ok := stringifyTokenValue(payload["Token"])
	if !ok || token == "" {
		return ErrInvalidNotificationToken
	}

	expected := BuildNotificationToken(payload, n.password, false)
	if secureEqualHex(expected, token) {
		return nil
	}

	legacyExpected := BuildNotificationToken(payload, n.password, true)
	if secureEqualHex(legacyExpected, token) {
		return nil
	}

	return ErrInvalidNotificationToken
}

// BuildRequestToken computes a request token from scalar root fields only.
func BuildRequestToken(payload map[string]any, password string) string {
	return buildToken(payload, password, map[string]struct{}{
		"Token": {},
	})
}

// BuildNotificationToken computes a notification token while excluding nested objects
// and optionally excluding Success to accommodate the prompt-specific variant.
func BuildNotificationToken(payload map[string]any, password string, excludeSuccess bool) string {
	excluded := map[string]struct{}{
		"Token":   {},
		"Data":    {},
		"DATA":    {},
		"Receipt": {},
	}
	if excludeSuccess {
		excluded["Success"] = struct{}{}
	}
	return buildToken(payload, password, excluded)
}

func buildToken(payload map[string]any, password string, excluded map[string]struct{}) string {
	values := make(map[string]string, len(payload)+1)
	for key, raw := range payload {
		if _, skip := excluded[key]; skip {
			continue
		}
		if rendered, ok := stringifyTokenValue(raw); ok {
			values[key] = rendered
		}
	}
	values["Password"] = password

	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	var builder strings.Builder
	for _, key := range keys {
		builder.WriteString(values[key])
	}
	sum := sha256.Sum256([]byte(builder.String()))
	return hex.EncodeToString(sum[:])
}

func stringifyTokenValue(value any) (string, bool) {
	switch v := value.(type) {
	case nil:
		return "", false
	case string:
		return v, true
	case bool:
		return strconv.FormatBool(v), true
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10), true
		}
		return strconv.FormatFloat(v, 'f', -1, 64), true
	case float32:
		f := float64(v)
		if f == float64(int64(f)) {
			return strconv.FormatInt(int64(f), 10), true
		}
		return strconv.FormatFloat(f, 'f', -1, 32), true
	case int:
		return strconv.Itoa(v), true
	case int8:
		return strconv.FormatInt(int64(v), 10), true
	case int16:
		return strconv.FormatInt(int64(v), 10), true
	case int32:
		return strconv.FormatInt(int64(v), 10), true
	case int64:
		return strconv.FormatInt(v, 10), true
	case uint:
		return strconv.FormatUint(uint64(v), 10), true
	case uint8:
		return strconv.FormatUint(uint64(v), 10), true
	case uint16:
		return strconv.FormatUint(uint64(v), 10), true
	case uint32:
		return strconv.FormatUint(uint64(v), 10), true
	case uint64:
		return strconv.FormatUint(v, 10), true
	default:
		return "", false
	}
}

func secureEqualHex(expected, actual string) bool {
	if len(expected) != len(actual) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(expected), []byte(actual)) == 1
}

// ExtractString fetches a string-like scalar from a callback payload.
func ExtractString(payload map[string]any, key string) (string, error) {
	value, ok := stringifyTokenValue(payload[key])
	if !ok {
		return "", fmt.Errorf("missing or invalid %s", key)
	}
	return value, nil
}

// ExtractBool fetches a bool-like scalar from a callback payload.
func ExtractBool(payload map[string]any, key string) (bool, error) {
	raw, exists := payload[key]
	if !exists {
		return false, fmt.Errorf("missing %s", key)
	}
	switch v := raw.(type) {
	case bool:
		return v, nil
	case string:
		parsed, err := strconv.ParseBool(strings.TrimSpace(v))
		if err != nil {
			return false, fmt.Errorf("invalid bool in %s", key)
		}
		return parsed, nil
	default:
		return false, fmt.Errorf("invalid bool in %s", key)
	}
}

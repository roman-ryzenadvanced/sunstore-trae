'use client'

import { useAppStore } from '@/store/app-store'
import {
  LayoutDashboard,
  Building2,
  Package,
  ShoppingCart,
  MessageSquare,
  Users,
  CreditCard,
  Eye,
  LogOut,
  Store,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { label: 'Stores', icon: Building2, view: 'sites' },
  { label: 'Products', icon: Package, view: 'products' },
  { label: 'Orders', icon: ShoppingCart, view: 'orders' },
  { label: 'Support Tickets', icon: MessageSquare, view: 'tickets' },
  { label: 'Subscribers', icon: Users, view: 'subscribers' },
  { label: 'Payment Settings', icon: CreditCard, view: 'payment-settings' },
  { label: 'Storefront Preview', icon: Eye, view: 'storefront-preview' },
] as const

export function AppSidebar() {
  const { currentView, user, navigate, logout } = useAppStore()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Store className="size-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">
              SunStore
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      isActive={currentView === item.view}
                      tooltip={item.label}
                      onClick={() => navigate(item.view)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <Separator className="mb-2" />
          <div className="flex items-center gap-3 px-2 py-1.5">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {typeof user?.name === 'string'
                  ? user.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'SA'
                  : 'SA'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium truncate">
                {user?.name || 'Super Admin'}
              </span>
              <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">
                Super Admin
              </Badge>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <ScrollArea className="flex-1">
          <main className="p-4 md:p-6">
            <AppView />
          </main>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppView() {
  const currentView = useAppStore((s) => s.currentView)

  switch (currentView) {
    case 'login':
      return null // handled externally
    case 'dashboard':
      return <DashboardView />
    case 'sites':
      return <SitesView />
    case 'site-create':
      return <SiteCreateView />
    case 'site-detail':
      return <SiteDetailView />
    case 'products':
      return <AllProductsView />
    case 'orders':
      return <AllOrdersView />
    case 'tickets':
      return <CrmTicketsView />
    case 'subscribers':
      return <CrmSubscribersView />
    case 'payment-settings':
      return <PaymentSettingsView />
    case 'storefront-preview':
      return <StorefrontPreviewView />
    case 'checkout-status':
      return <CheckoutStatusView />
    default:
      return <DashboardView />
  }
}

// Lazy placeholders — replaced by real imports below
import { StatsCards } from './stats-cards'
import { SitesList } from './sites-list'
import { SiteCreate } from './site-create'
import { SiteDetail } from './site-detail'
import { AllProducts } from './all-products'
import { AllOrders } from './all-orders'
import { CrmTickets } from './crm-tickets'
import { CrmSubscribers } from './crm-subscribers'
import { PaymentSettings } from './payment-settings'
import { StorefrontPreview } from './storefront-preview'
import { CheckoutStatus } from './checkout-status'

function DashboardView() {
  return <StatsCards />
}
function SitesView() {
  return <SitesList />
}
function SiteCreateView() {
  return <SiteCreate />
}
function SiteDetailView() {
  return <SiteDetail />
}
function AllProductsView() {
  return <AllProducts />
}
function AllOrdersView() {
  return <AllOrders />
}
function CrmTicketsView() {
  return <CrmTickets />
}
function CrmSubscribersView() {
  return <CrmSubscribers />
}
function PaymentSettingsView() {
  return <PaymentSettings />
}
function StorefrontPreviewView() {
  return <StorefrontPreview />
}
function CheckoutStatusView() {
  return <CheckoutStatus />
}
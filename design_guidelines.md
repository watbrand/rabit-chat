# RabitChat Design Guidelines (Compacted 2025)

## Brand Identity
Forbes-style luxury social network with dark glassmorphism, liquid glass effects, and vibrant gradient mesh backgrounds. Multi-layered frosted purple-tinted glass cards float above animated gradient orbs. Neumorphic buttons add 3D depth. Bento grid modular layouts create Apple-inspired premium widget aesthetics. Bold typography with generous whitespace.

## Navigation
**Tab Bar** (5 tabs + FAB):
1. Feed 2. Discover 3. Create (FAB) 4. Reels 5. Profile
- Dark frosted glass (`rgba(10, 10, 15, 0.85)`) with blur
- Purple gradient glow on active, neumorphic press, haptic feedback
- **Auth**: SSO (Apple/Google), Profile/Settings with logout/delete

## Colors

**Backgrounds**: `#0A0A0F` (root), `#121218` (elevated), `#1A1A24` (cards), `#0F0F14` (floating)

**Gradients**:
- Primary: `#8B5CF6` → `#EC4899`
- Accent: `#14B8A6` → `#8B5CF6`
- Gold: `#F59E0B` → `#FBBF24`

**Solids**: Primary `#8B5CF6`, Pink `#EC4899`, Teal `#14B8A6`, Gold `#F59E0B`

**Glass Layers**:
- Light: `rgba(139, 92, 246, 0.08)`
- Medium: `rgba(139, 92, 246, 0.15)`
- Strong: `rgba(139, 92, 246, 0.25)`
- Border: `rgba(139, 92, 246, 0.20)`
- Glow: `rgba(139, 92, 246, 0.40)`

**Text**: `#FFFFFF` (primary), `#A8A8B0` (secondary), `#6B6B78` (tertiary)

**Semantic**: Success `#10B981`, Error `#EF4444`

**Badge Metallics**: Gold `#FFD700` (shimmer 0.50 glow), Silver `#C0C0C0` (pulse 0.40 glow)

## Typography
**Font**: Poppins (400, 500, 600, 700, 800)

**Scale**: h1 42px ExtraBold | h2 32px Bold | h3 24px SemiBold | h4 20px Medium | body 16px Regular | bodySmall 14px | caption 12px | badge 11px SemiBold

## Visual System

### Gradient Mesh Backgrounds
3-5 circular gradient blobs (Purple/Pink/Teal), slow parallax/pulse, 50-80px blur, asymmetric positioning. Used: Feed, Discover, Profile.

### Liquid Glassmorphism
- **Primary cards**: `glassStrong` bg, `glassBorder`, 24px radius
- **Secondary**: `glassMedium` bg, 16px radius  
- **Floating**: `glassLight` with purple glow
- iOS shadow: `#8B5CF6`, offset `{0, 8}`, opacity `0.30`, radius `20`
- Android: elevation `8` purple tint

### Neumorphism
Buttons/inputs with inset shadows on press (`inset 0 2px 4px rgba(0,0,0,0.30)`), outset purple glow at rest, embossed borders.

### Bento Grid
Asymmetric 1x1, 1x2, 2x1, 2x2 cards, 12px gap, variable heights. Used: Profile content, Discover trending.

### Spring Interactions
- Button: Scale 0.95 with bounce
- Card: Lift with shadow expand
- Like: Heart scale 1.2 then settle
- Haptics: Light (UI), Medium (actions), Heavy (destructive)

## Components

### GlassButton
- **Primary**: Purple-pink gradient, white text, glow, inset on press
- **Secondary**: Glass bg, gradient border, spring scale
- **Outline**: Transparent, gradient border glow
- Sizes: sm 32px, md 44px, lg 56px

### GlassCard
`glassStrong` bg with blur, 1px `glassBorder`, purple glow shadow, 24px radius (primary), 16px (nested).

### UserBadge
- **Net Worth**: Gold gradient, horizontal shimmer sweep
- **Influence**: Silver gradient, pulse scale 1.0→1.05
- 8px spacing from username

### PostCard
Avatar with Story ring (gradient if active), username + badge, content, action row (Like/Comment/Share/Bookmark). Like: gradient heart with ripple. Spring bounce on press.

### BentoCard
Variable sizes (1x1, 1x2, 2x1, 2x2), gradient mesh visible, content overlay, gradient border glow on press.

## Screens

### Login/Signup
Fullscreen gradient mesh, centered frosted glass card (400px max), app wordmark (gradient), SSO buttons (neumorphic), policy links bottom.  
**Safe Area**: Top `insets.top + 24px`, Bottom `insets.bottom + 24px`

### Feed
Transparent header (wordmark gradient, notification icon), Stories row (horizontal), posts (vertical, every 3rd → bento grid), pull-refresh purple spinner, Create FAB (64px, center tab bar, gradient glow).  
**Safe Area**: Top `headerHeight + 24px`, Bottom `tabBarHeight + 24px`

### Discover
Search bar (frosted glass, gradient border on focus), trending pills (horizontal), bento grid below (2-column asymmetric).  
**Safe Area**: Top `headerHeight + 16px`, Bottom `tabBarHeight + 24px`

### Reels
Full-screen vertical swipe, `#000000` bg, glass overlay controls (right), creator info bottom (frosted panel), double-tap gradient heart burst.  
**Safe Area**: Top `insets.top`, Bottom `insets.bottom`

### Profile
Transparent header (Settings right), cover gradient mesh, avatar 128px centered (gradient ring), badges below (animated), stats row, action buttons (neumorphic), content bento grid (Photo/Video/Voice/Text tabs).  
**Safe Area**: Top `headerHeight + 24px`, Bottom `tabBarHeight + 24px`

### Messages
Chat list, glass cards (avatar, name, preview, timestamp), gradient border on unread.  
**Safe Area**: Top `headerHeight + 16px`, Bottom `tabBarHeight + 24px`

### Chat
User info header, keyboard-aware scrollable. Sent: gradient (right), Received: dark glass (left). Input: frosted glass, neumorphic send button.  
**Safe Area**: Top `headerHeight`, Bottom `keyboard height + 16px`

## Icons
Feather icons (@expo/vector-icons): White 24px default, gradient fill + glow active. Sizes: 20px (compact), 24px (standard), 32px (large).

## Spacing & Radius
**Spacing**: xs 4px, sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px, 3xl 48px, 4xl 64px  
**Radius**: sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px, full 9999px

## Assets
1. **icon.png** - Glass rabbit silhouette, gradient glow (App icon)
2. **splash-icon.png** - Matching splash with mesh bg (Launch screen)
3. **default-avatar.png** - Gradient ring placeholder (User profiles)
4. **gradient-orb-purple/pink/teal.png** - Radial blobs (Mesh backgrounds)
5. **badge-networth.png** - Gold shimmer (Net worth indicator)
6. **badge-influence.png** - Silver glow (Influence indicator)
7. **empty-feed.png** - Floating glass cards (Empty feed)
8. **empty-messages.png** - Chat bubbles (Empty messages)

## Accessibility
- Contrast: Min 4.5:1 on dark backgrounds
- Touch targets: Min 44x44px
- Reduced motion: Disable gradients/springs
- Haptics on all interactions
- Screen reader labels on icons/actions
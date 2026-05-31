# Argus Responsive Design Specification

## Purpose

Argus must support watching streams, browsing channels, searching, signing in,
and managing a creator stream across phones, tablets, laptops, and large desktop
displays. This document defines the responsive behavior required before the UI is
considered complete.

The current application is desktop-first. Several layouts use fixed-width sidebars
and desktop-only panels without a mobile alternative. The rules below replace those
assumptions with explicit behavior for each viewport class.

## Device Coverage

The interface must be fluid, not tailored only to a short list of popular devices.
Every layout must work continuously as the viewport changes width or height. Named
device sizes are test fixtures, not the only supported sizes.

Argus supports web-capable devices with a viewport width of 280 px and above:

- Small, standard, and large phones
- Landscape phones
- Foldable phones in folded, unfolded, and split-window modes
- Small and large tablets in portrait, landscape, and split-screen modes
- Touch laptops, standard laptops, and desktop monitors
- High-density and ultrawide desktop monitors
- TV-style and living-room browser viewing
- Desktop browser windows resized to any intermediate width

Below 280 px, the app should remain scrollable and readable, but full feature
usability is best-effort because available space is smaller than the required touch
targets.

| Viewport | Width | Typical devices | Layout mode |
| --- | ---: | --- | --- |
| Minimum supported | 280-319 px | Narrow phones and split windows | Dense single column |
| Compact mobile | 320-479 px | Small phones | Single column |
| Mobile | 480-767 px | Large phones | Single column |
| Tablet | 768-1023 px | Tablets and small landscape screens | Compact multi-panel |
| Desktop | 1024-1439 px | Laptops and standard monitors | Full navigation |
| Large desktop | 1440 px and above | Large monitors | Expanded content grid |

Use Tailwind's existing mobile-first breakpoints:

| Tailwind prefix | Starts at | Intended use |
| --- | ---: | --- |
| Base | 0 px | Phone defaults |
| `sm` | 640 px | Large-phone refinements |
| `md` | 768 px | Tablet layout |
| `lg` | 1024 px | Desktop sidebars |
| `xl` | 1280 px | Wider content grids |
| `2xl` | 1536 px | Large-display density |

## Global Rules

### Content and spacing

- No page may create horizontal scrolling at any supported width of 280 px or above.
- Layouts must respond continuously between breakpoints. Do not rely on a component
  fitting only at the exact widths in the test matrix.
- Interactive controls must have a minimum touch target of 44 by 44 px on mobile.
- Main-page horizontal padding is 16 px on mobile, 24 px on tablet, and 32-40 px on
  desktop.
- Long usernames, stream titles, URLs, and stream keys must truncate or wrap without
  pushing controls off screen.
- Account for device safe areas where controls touch screen edges:
  `env(safe-area-inset-top)`, `env(safe-area-inset-right)`,
  `env(safe-area-inset-bottom)`, and `env(safe-area-inset-left)`.

### Navigation

- Desktop sidebars are enhancements, not required navigation.
- Mobile navigation must provide access to Browse, Following, Search, and Creator
  Dashboard without a permanently visible sidebar.
- Any panel hidden on mobile must have an explicit mobile replacement such as a
  drawer, sheet, tab, or button.
- Fixed headers must not obscure page content when browser chrome changes height.
- Navigation must remain operable with touch, mouse, keyboard, and TV-style remote
  focus navigation where the browser exposes keyboard events.

### Media

- Stream video keeps a 16:9 aspect ratio whenever possible.
- The player fills available width on phones.
- Video uses `object-contain` so the broadcast is never cropped.
- Controls must remain usable in portrait and landscape orientation.
- On ultrawide displays, constrain reading content while allowing the player and
  stream-card grid to use available space.
- On TV-style displays, preserve large readable controls and avoid stretching text
  content across the full screen width.

### Input modes

- Do not expose hover-only actions. Any hover action must also be reachable through
  touch and keyboard focus.
- Forms must remain usable when a mobile virtual keyboard reduces viewport height.
- Respect coarse pointers: keep touch targets separated enough to avoid accidental
  activation.
- Respect reduced-motion preferences for drawer, sidebar, and hover transitions.

### Orientation and window changes

- Layouts must adapt without a reload after rotation, fold/unfold, split-window
  resizing, browser zoom, or desktop window resizing.
- Use width-based layout decisions first. Do not assume a phone is always portrait or
  a tablet is always landscape.
- Short-height landscape layouts must keep navigation and video controls reachable.

### Accessibility

- Icon-only buttons require `aria-label`.
- Keyboard focus states must remain visible.
- Drawers and sheets must trap focus while open and close with Escape.
- Color is not the only indicator for live status, enabled settings, or errors.

## Browse Experience

Primary component: `components/browse-app.tsx`

### Mobile: 320-767 px

- Use a compact top bar with logo, search icon, and account control.
- Replace the full search input with a search icon below 480 px. Opening it displays
  a full-width search field or search sheet.
- Replace the left sidebar with an off-canvas drawer opened by a menu button.
- Do not reserve the current 60 px left margin when the drawer is closed.
- Hide the text label for Creator Dashboard below 640 px and show an icon button with
  an accessible label.
- Stream cards render in one column.
- Reduce hero copy to a 24-32 px heading and keep hero padding at 16-20 px.

### Narrow mobile and split window: 280-319 px

- Apply the mobile layout with denser 12 px horizontal gutters.
- Show icon-only navigation actions with accessible labels.
- Allow secondary metadata and tags to wrap or hide before primary controls.

### Tablet: 768-1023 px

- Show the left sidebar in collapsed 60 px mode by default.
- Allow users to expand the sidebar as an overlay drawer.
- Keep a two-column stream-card grid when card width remains at least 260 px.
- Keep the search field visible.

### Desktop: 1024 px and above

- Use the existing expandable 240 px sidebar.
- Use two to four stream-card columns based on available width.
- Preserve the full navbar and full Creator Dashboard label.

### Ultrawide and TV-style: 1920 px and above

- Increase stream-card columns only while cards remain readable.
- Constrain hero text and metadata line length.
- Keep sidebar width stable rather than scaling it with viewport width.

## Channel Viewing Experience

Primary components:

- `components/channel-page.tsx`
- `components/live-video-player.tsx`
- `components/live-chat-panel.tsx`

### Mobile: 320-767 px

- Stack player, creator metadata, actions, about section, and chat vertically.
- Place the player edge-to-edge or within a maximum 16 px page gutter.
- Replace the desktop right-side chat panel with a tab or bottom sheet labeled
  `Chat`.
- Provide a visible button to open chat while the stream is live.
- Wrap creator actions below metadata when they do not fit on one row.
- Use abbreviated viewer count overlays that do not block player controls.
- Support portrait and landscape orientation without requiring a page reload.

### Narrow mobile and split window: 280-319 px

- Keep the player full width.
- Use icon-only creator actions where labels cannot fit.
- Present chat as a full-screen sheet.

### Tablet: 768-1023 px

- Keep the video area flexible.
- Show chat as a collapsible 280-320 px right panel in landscape.
- Prefer a bottom sheet or hidden panel in portrait when the player would become too
  narrow.

### Desktop: 1024 px and above

- Show chat as the current collapsible 340 px right panel.
- Cap player height while keeping the entire video visible.

### Ultrawide and TV-style: 1920 px and above

- Center the player and metadata inside a sensible maximum content width.
- Keep chat readable at 340-400 px rather than stretching it proportionally.

### Live states

The player must define visible UI for:

| State | Required UI |
| --- | --- |
| Offline | Offline message and creator avatar |
| Connecting | Loading indicator and `Connecting to stream...` |
| Live without video track | `Waiting for broadcast video...` |
| Live video | Video, viewer count, volume, and fullscreen controls |
| Connection error | Human-readable retry message and retry action |

## Creator Dashboard

Primary components:

- `components/dashboard-shell.tsx`
- `components/dashboard-settings.tsx`
- `components/connection-keys.tsx`
- `components/community-list.tsx`

### Mobile: 320-767 px

- Replace the fixed 220 px dashboard sidebar with a menu button and slide-in drawer.
- Main content uses no permanent left margin.
- Keep dashboard title short enough to fit beside Exit: use `Dashboard` on compact
  phones.
- Stack form actions and fields vertically.
- Ensure server URL and stream key scroll horizontally inside their own containers,
  not at page level.
- Community rows may wrap the username and action button onto separate lines.

### Narrow mobile and split window: 280-319 px

- Use 12 px content gutters.
- Allow dashboard title, credentials, community rows, and form actions to wrap.

### Tablet: 768-1023 px

- Default to the collapsed 60 px dashboard sidebar.
- Allow expansion as an overlay.
- Keep forms within a readable maximum width of 768 px.

### Desktop: 1024 px and above

- Use the existing expandable 220 px dashboard sidebar.
- Keep form content left-aligned and constrain long forms to 768-896 px.

## Authentication Screens

Primary routes:

- `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

Requirements:

- Center the auth card with 16 px screen gutters.
- Card width must not exceed available viewport width.
- Allow the page to scroll when the mobile keyboard is open.
- Avoid fixed vertical centering that hides fields behind browser chrome.

## Current Responsive Gaps

| Priority | Gap | Current location | Required correction |
| --- | --- | --- | --- |
| P0 | Browse sidebar always occupies screen space | `components/browse-app.tsx` | Use a hidden mobile drawer and remove phone left margin |
| P0 | Dashboard sidebar always occupies 60-220 px | `components/dashboard-shell.tsx` | Use a mobile drawer and no phone left margin |
| P0 | Live chat disappears below tablet width | `components/live-chat-panel.tsx` | Add a mobile chat button and sheet or stacked panel |
| P1 | Signed-in navbar can overflow | `components/browse-app.tsx` | Collapse labels and search UI on compact widths |
| P1 | Channel metadata actions can crowd the title | `components/channel-page.tsx` | Wrap actions and metadata on mobile |
| P1 | Community rows assume one-line width | `components/community-list.tsx` | Allow wrapping and preserve touch targets |
| P2 | Loading layout reserves desktop sidebar space | `app/loading.tsx` | Match the responsive browse layout |

## Implementation Phases

### Phase 1: Navigation foundations

- Create reusable mobile drawer behavior.
- Make browse and dashboard sidebars desktop-only persistent panels.
- Add mobile menu triggers and remove phone left margins.
- Add safe-area padding.

### Phase 2: Viewer experience

- Make navbar controls compact at phone widths.
- Stack channel metadata and actions.
- Add mobile live-chat sheet or stacked chat panel.
- Add explicit connecting, missing-track, and error states.

### Phase 3: Dashboard and forms

- Update dashboard header and drawer.
- Audit keys, settings, community, and upload forms at 320 px.
- Add wrapping and local horizontal scrolling for credentials.

### Phase 4: Verification

- Test all routes at each viewport in portrait and landscape.
- Verify with signed-out viewer, signed-in viewer, and creator accounts.
- Verify offline, connecting, live, reconnecting, and OBS-stopped states.

## Acceptance Checklist

### Minimum supported width: 280 px

- [ ] No horizontal page scrolling
- [ ] All primary actions remain reachable
- [ ] Icon-only actions have accessible labels
- [ ] Video player fits viewport width
- [ ] Forms and credential containers remain usable

### Compact mobile: 320 px

- [ ] No horizontal page scrolling
- [ ] Browse cards use one column
- [ ] Browse navigation is reachable through a menu
- [ ] Search remains reachable
- [ ] Live video fits viewport width
- [ ] Chat can be opened while live
- [ ] Creator dashboard routes are usable
- [ ] Server URL and key do not overflow the page

### Tablet: 768 px

- [ ] Browse sidebar defaults to compact mode
- [ ] Chat can collapse without breaking the player
- [ ] Stream grid uses at least two columns when space permits
- [ ] Dashboard navigation remains reachable

### Desktop: 1024 px and above

- [ ] Browse and dashboard sidebars expand and collapse
- [ ] Chat panel remains usable beside the video
- [ ] Stream-card grid scales to available width
- [ ] Existing desktop workflows remain unchanged

### Ultrawide and TV-style: 1920 px and above

- [ ] Text content has readable maximum widths
- [ ] Player and chat remain visually balanced
- [ ] Stream cards do not become excessively wide
- [ ] Keyboard or remote-style focus navigation remains visible

### Dynamic resizing

- [ ] Rotation adapts without reload
- [ ] Fold and unfold transitions adapt without reload
- [ ] Split-window resizing adapts without reload
- [ ] Browser zoom at 200% preserves access to primary actions
- [ ] Virtual keyboard does not hide required form controls

## Test Matrix

| Device profile | Viewport | Orientation |
| --- | --- | --- |
| Narrow split window | 280 x 653 | Portrait |
| Small phone | 320 x 568 | Portrait |
| Modern phone | 390 x 844 | Portrait |
| Modern phone | 844 x 390 | Landscape |
| Foldable outer display | 360 x 748 | Portrait |
| Foldable inner display | 717 x 512 | Landscape |
| Tablet | 768 x 1024 | Portrait |
| Tablet | 1024 x 768 | Landscape |
| Tablet split window | 507 x 768 | Portrait |
| Laptop | 1366 x 768 | Landscape |
| Desktop | 1440 x 900 | Landscape |
| Large desktop | 1920 x 1080 | Landscape |
| Ultrawide desktop | 2560 x 1080 | Landscape |
| TV-style display | 3840 x 2160 | Landscape |

Test these routes:

```text
/
/search?term=test
/YOUR_USERNAME
/u/YOUR_USERNAME
/u/YOUR_USERNAME/keys
/u/YOUR_USERNAME/chat
/u/YOUR_USERNAME/community
/sign-in
/sign-up
```

## Definition of Done

Responsive work is complete when every checklist item passes, no supported viewport
produces horizontal page scrolling, all hidden desktop features have mobile
replacements, and streaming can be watched and managed from a phone without relying
on desktop-only navigation. The interface must also remain usable at intermediate
widths and after dynamic resizing, orientation changes, fold transitions, and browser
zoom changes.

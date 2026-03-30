# El Posit - Design System Documentation

## Overview
A complete design system for El Posit reservation management platform. Built with Next.js, React, and Tailwind CSS.

## Table of Contents
1. [Colors](#colors)
2. [Typography](#typography)
3. [Components](#components)
4. [Patterns](#patterns)

---

## Colors

### Brand Colors
```css
/* Primary Colors */
--cream: #F5F5F0        /* Main background */
--posit-red: #C41E3A    /* Accent/CTA */
--posit-black: #000000  /* Primary text/borders */
--posit-white: #FFFFFF  /* Cards/contrast */

/* Variants */
--posit-red-dark: #9B1830
--posit-red-light: #D94F65
--cream-50: #FAFAF8
--cream-200: #EAEAE3
--cream-300: #D5D5CC
```

### Semantic Colors
```css
--success: bg-green-700
--warning: bg-amber-500
--error: bg-red-600
--info: bg-black
```

### Usage Guidelines
- Use **cream** as primary background for light sections
- Use **black** sections for contrast and CTAs
- Use **posit-red** sparingly for accents and important actions
- Maintain high contrast for accessibility (WCAG AA)

---

## Typography

### Font Families
```css
font-display: "Oswald", sans-serif      /* Headings, buttons, labels */
font-serif: "Playfair Display", serif   /* Descriptions, body text */
font-sans: "Inter", sans-serif          /* UI elements, forms */
```

### Type Scale
```css
text-hero: 5rem / 1          /* Main hero titles */
text-display-lg: 4rem / 1.1  /* Large section titles */
text-display-md: 3rem / 1.1  /* Section titles */
text-display-sm: 2rem / 1.2  /* Subsection titles */

text-base: 1rem              /* Body text */
text-sm: 0.875rem            /* Secondary text */
text-xs: 0.75rem             /* Labels, captions */
```

### Usage Guidelines
- **Display**: All uppercase, tight tracking
- **Serif**: Italic for emphasis, normal for descriptions
- **Sans**: All UI elements, forms, navigation

---

## Components

### Button

**Variants**: `primary` | `secondary` | `outline` | `ghost` | `danger`
**Sizes**: `sm` | `md` | `lg`

```tsx
import { Button } from "@/components/Button"

<Button variant="primary" size="lg">
  RESERVAR MESA
</Button>
```

**Best Practices**:
- Use `primary` for main CTAs
- Use `secondary` for alternative actions
- Use `outline` for tertiary actions
- Use `danger` for destructive actions
- Use `ghost` for subtle actions

---

### Input

```tsx
import { Input } from "@/components/Input"

<Input
  label="Nombre completo"
  placeholder="Juan García"
  error={error}
  helperText="Obligatorio"
/>
```

**Features**:
- Label with uppercase styling
- Error state validation
- Helper text support
- Full accessibility

---

### Select

```tsx
import { Select } from "@/components/Select"

<Select
  label="Restaurante"
  options={[
    { value: "cambrils", label: "El Posit - Cambrils" },
    { value: "tarragona", label: "El Posit - Tarragona" },
  ]}
  value={value}
  onChange={handleChange}
/>
```

---

### Modal

```tsx
import { Modal, Modal.Footer } from "@/components/Modal"

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirmar Acción"
  size="md"
>
  <p>Content here...</p>
  <Modal.Footer
    onCancel={onClose}
    onConfirm={handleConfirm}
    cancelText="Cancelar"
    confirmText="Confirmar"
  />
</Modal>
```

**Sizes**: `sm` | `md` | `lg` | `xl`

---

### Toast

```tsx
import { toast } from "@/components/Toast"

// Success
toast("Reserva creada correctamente", "success")

// Error
toast("Error al crear la reserva", "error")

// Warning
toast("Campos incompletos", "warning")

// Info
toast("Procesando...", "info")
```

---

### Card

```tsx
import { Card, CardContent, CardTitle, CardDescription } from "@/components/Card"

<Card variant="outlined">
  <CardContent>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardContent>
</Card>
```

**Variants**: `default` | `elevated` | `outlined`

---

### KPICard

```tsx
import { KPICard } from "@/components/KPICard"

<KPICard
  title="Pendientes Totales"
  value={stats.totalPending}
  change={{ value: 12, trend: "up" }}
  icon={<Icon />}
/>
```

---

### Timeline

```tsx
import { Timeline } from "@/components/Timeline"

<Timeline
  items={[
    {
      id: "1",
      title: "Solicitud creada",
      time: "10:00 AM",
      status: "completed"
    },
    // ... more items
  ]}
/>
```

**Status**: `completed` | `current` | `pending`

---

### SearchBar

```tsx
import { SearchBar } from "@/components/SearchBar"

<SearchBar
  onSearch={handleSearch}
  placeholder="Buscar..."
  debounceMs={300}
/>
```

---

### Pagination

```tsx
import { Pagination } from "@/components/Pagination"

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setPage}
  showFirstLast
/>
```

---

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs"

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

### Progress

```tsx
import { Progress } from "@/components/Progress"

<Progress
  value={75}
  max={100}
  variant="success"
  showLabel
  size="md"
/>
```

---

### Chip

```tsx
import { Chip, ChipGroup } from "@/components/Chip"

// Single chip
<Chip
  label="Tag"
  variant="primary"
  onRemove={() => {}}
  icon={<Icon />}
/>

// Chip group
<ChipGroup
  chips={[
    { label: "Opción 1", value: "1" },
    { label: "Opción 2", value: "2" },
  ]}
  selected={selected}
  onChange={setSelected}
/>
```

---

## Patterns

### Form Layout

```tsx
<div className="space-y-6">
  <Input label="Field 1" />
  <Input label="Field 2" />
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <Select label="Field 3" />
    <Input label="Field 4" />
  </div>
</div>
```

### Page Structure

```tsx
<>
  <Header variant="light" />
  <main className="min-h-screen bg-cream pt-24 pb-16">
    <Container size="lg">
      {/* Content */}
    </Container>
  </main>
  <footer className="bg-black text-white py-16">
    {/* Footer content */}
  </footer>
</>
```

### Section Styling

```tsx
{/* Light section */}
<section className="section-light py-24">
  <Container>
    {/* Content */}
  </Container>
</section>

{/* Dark section */}
<section className="section-dark py-24">
  <Container>
    {/* Content */}
  </Container>
</section>
```

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for body, 3:1 for large text)
- Use semantic colors for status indicators

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Visible focus states on all interactive elements
- Escape closes modals and dropdowns

### Screen Readers
- Proper ARIA labels on all interactive elements
- Semantic HTML structure
- Alt text for all images

---

## Best Practices

### Spacing
- Use Tailwind's spacing scale consistently
- Section padding: `py-16` (4rem) or `py-24` (6rem)
- Component gaps: `gap-4` (1rem) or `gap-6` (1.5rem)

### Border Radius
- Small elements: `rounded` (0.25rem)
- Cards: `rounded-lg` (0.5rem)
- Circular: `rounded-full`

### Shadows
- Subtle: `shadow-sm`
- Cards: `shadow-lg`
- Modals: `shadow-xl`

### Transitions
- Duration: `duration-200` for quick, `duration-300` for smooth
- Properties: `transition-colors` or `transition-all`

---

## Component Library Structure

```
src/components/
├── Core/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   └── Container.tsx
├── Forms/
│   ├── Input.tsx
│   ├── Select.tsx
│   └── Textarea.tsx
├── Overlays/
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── Dropdown.tsx
├── Data Display/
│   ├── StatsCard.tsx
│   ├── KPICard.tsx
│   ├── Timeline.tsx
│   └── EmptyState.tsx
└── Navigation/
    ├── Header.tsx
    ├── Tabs.tsx
    ├── Pagination.tsx
    └── Progress.tsx
```

---

## Changelog

### v1.0.0 (Current)
- Initial design system
- 20+ components
- Full accessibility support
- Responsive design
- Dark/light sections

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

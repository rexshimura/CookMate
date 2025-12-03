# CookMate Sidebar Design System

This document defines the design patterns and styling elements used in the CookMate sidebar that should be applied consistently across all components.

## Core Design Philosophy

The sidebar employs a modern, sophisticated design language with:
- **Glass Morphism**: Subtle transparency with backdrop blur effects
- **Gradient Backgrounds**: Multi-stop gradients for depth and visual interest
- **Sophisticated Animations**: Smooth transitions and hover effects
- **Premium Feel**: High-quality shadows and rounded corners

## Color Palette

### Primary Colors
- **Orange Gradient**: `from-orange-500 to-orange-600` to `from-orange-600 to-red-600`
- **Stone Tones**: `stone-50`, `stone-100`, `stone-200`, `stone-400`, `stone-600`, `stone-800`
- **Background Gradient**: `from-white via-stone-50 to-stone-100`
- **Glass Effect**: `bg-white/40` with `backdrop-blur-xl`

### Secondary Colors
- **Success**: `green-500`, `green-600`
- **Info**: `blue-500`, `blue-600`
- **Warning**: `yellow-400`, `yellow-500`
- **Danger**: `red-500`, `red-600`
- **Pink**: `pink-500`, `pink-600` for favorites

## Component Styling Patterns

### Cards and Containers
```css
/* Primary container styling */
className="bg-gradient-to-b from-white via-stone-50 to-stone-100 
          border border-stone-200/60 
          shadow-2xl shadow-stone-900/10 
          backdrop-blur-xl 
          rounded-2xl 
          transition-all duration-500 ease-out"
```

### Buttons
```css
/* Primary button */
className="bg-gradient-to-r from-orange-600 to-red-600 
          text-white 
          shadow-lg hover:shadow-xl 
          hover:scale-105 active:scale-95 
          transition-all duration-300 
          rounded-2xl 
          font-semibold"

/* Secondary button */
className="bg-gradient-to-br from-blue-50 to-indigo-50 
          text-blue-600 
          border border-blue-200 
          hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100"
```

### Interactive Elements
```css
/* Hover states */
className="hover:scale-[1.02] active:scale-[0.98] 
          transition-all duration-300 
          transform"

/* Focus states */
className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
```

## Animation Patterns

### Standard Transitions
- **Quick interactions**: `transition-all duration-200`
- **Standard interactions**: `transition-all duration-300`
- **Complex animations**: `transition-all duration-500 ease-out`

### Hover Effects
- **Scale**: `hover:scale-105`
- **Shadow**: `hover:shadow-xl`
- **Transform**: `hover:translate-y-[-2px]`

### Shimmer Effects
```css
className="bg-gradient-to-r from-transparent via-white/20 to-transparent 
          -translate-x-full group-hover:translate-x-full 
          transition-transform duration-1000"
```

## Layout Patterns

### Spacing
- **Padding**: `p-4`, `p-5`, `p-6`
- **Margin**: `m-4`, `mb-6`
- **Gaps**: `gap-3`, `gap-4`

### Border Radius
- **Small**: `rounded-lg`
- **Medium**: `rounded-xl`
- **Large**: `rounded-2xl`
- **Full**: `rounded-full`

### Typography
- **Headings**: `font-bold text-xl` with `tracking-wide`
- **Body**: `font-medium text-sm`
- **Captions**: `text-xs text-stone-500`

## Implementation Guidelines

### When to Use Glass Morphism
Apply `bg-white/40 backdrop-blur-xl` to:
- Modal overlays
- Floating panels
- Sidebar elements
- Tooltips and dropdowns

### When to Use Complex Gradients
Apply gradient backgrounds to:
- Primary buttons and CTAs
- Header sections
- Important call-out boxes
- Status indicators

### When to Use Sophisticated Shadows
Apply `shadow-2xl shadow-stone-900/10` to:
- Main containers
- Modal dialogs
- Floating elements
- Cards with glass morphism

## Component Examples

### Modern Card
```jsx
<div className="bg-gradient-to-b from-white via-stone-50 to-stone-100 
                border border-stone-200/60 
                shadow-2xl shadow-stone-900/10 
                backdrop-blur-xl 
                rounded-2xl p-6 
                transition-all duration-500 ease-out 
                hover:shadow-xl hover:scale-[1.02]">
  {/* Content */}
</div>
```

### Modern Button
```jsx
<button className="bg-gradient-to-r from-orange-600 to-red-600 
                  text-white shadow-lg hover:shadow-xl 
                  hover:scale-105 active:scale-95 
                  transition-all duration-300 
                  rounded-2xl px-6 py-3 
                  font-semibold relative overflow-hidden group">
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                  -translate-x-full group-hover:translate-x-full 
                  transition-transform duration-1000"></div>
  Button Text
</button>
```

## Consistency Rules

1. **Always use consistent border radius** within component families
2. **Maintain consistent shadow depth** across similar elements
3. **Use the same transition durations** for similar interactions
4. **Apply glass morphism consistently** across overlay elements
5. **Keep color usage consistent** with the established palette
6. **Use the same hover and focus patterns** throughout the app

## Migration Checklist

When updating components to match the sidebar design:

- [ ] Replace basic shadows with sophisticated shadow patterns
- [ ] Add gradient backgrounds where appropriate
- [ ] Implement consistent transition durations
- [ ] Add glass morphism effects to overlay elements
- [ ] Update button styling to use gradient patterns
- [ ] Add shimmer effects to interactive elements
- [ ] Ensure consistent spacing and typography
- [ ] Test hover and focus states across all components
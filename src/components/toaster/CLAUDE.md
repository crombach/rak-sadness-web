# toaster

`Toaster`: renders the `ToastContext` list. One `role="region"` holds the stack, and
each toast is `role="alert"` where it waits to be dismissed and `role="status"` where
it times out, so only a failure interrupts what a screen reader is saying. Every
`ToastType` (`primary`, `neutral`, `success`, `warning`, `danger`) has a start icon
and a `--<type>` class, drawn from that type's `--rak-<type>-100/-500/-700` ramp.

The region pauses every countdown on pointer enter or focus and resumes on leave or
blur, so a toast cannot time out while it is being read.

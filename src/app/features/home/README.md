# Home feature

The Home feature is the public entry point at `/home`. It currently provides a lightweight landing view, breadcrumb context, and a link into the protected Products route.

Home is intentionally independent from product data loading. If the landing page later gains recommendations or marketing sections, keep those concerns here and defer non-critical content at the page boundary where appropriate.

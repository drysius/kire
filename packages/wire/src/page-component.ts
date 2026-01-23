import { WireComponent } from "./component";
import { WithPagination } from "./traits/pagination";

// Manual Mixin application because TS decorators are experimental
class BasePageComponent extends WireComponent {}
export const WirePageComponent = WithPagination(BasePageComponent);

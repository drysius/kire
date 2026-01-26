import { WireComponent } from "./component";
import { WithPagination } from "./traits/pagination";

// Manual Mixin application because TS decorators are experimental
//@ts-expect-error ignore this erros
class BasePageComponent extends WireComponent {}
export const WirePageComponent = WithPagination(BasePageComponent);

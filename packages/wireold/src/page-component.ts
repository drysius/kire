import { Component } from "./core/component";
import { WithPagination } from "./traits/pagination";

class BasePageComponent extends Component {
    public render(): string | Promise<string> {
        return "";
    }
}

export const PageComponent = WithPagination(BasePageComponent);
export const WirePageComponent = PageComponent;


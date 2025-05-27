interface ParentNode {
    // Non nullable
    querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K];
    querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K];
    querySelector<K extends keyof MathMLElementTagNameMap>(selectors: K): MathMLElementTagNameMap[K];
    querySelector<E extends Element = HTMLElement>(selectors: string): E;
}

interface Document {
    // Non nullable
    getElementById(elementId: string): HTMLElement;
}

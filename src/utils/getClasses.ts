export default function getClasses(classes: { [className: string]: boolean }): string {
    return Object.entries(classes)
        .map(([className, isActive]) => isActive ? className : "")
        .filter(Boolean)
        .reduce((combined: string, className: string) => `${combined} ${className}`, "");
}
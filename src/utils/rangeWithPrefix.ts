export default function rangeWithPrefix(size: number, prefix = ""): Array<string> {
    return [...Array(size).keys()].map(index => `${prefix}${index + 1}`);
}
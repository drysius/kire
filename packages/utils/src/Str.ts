export class StrManager {
    /**
     * Limit the number of characters in a string.
     */
    limit(value: string, limit: number = 100, end: string = '...'): string {
        if (value.length <= limit) return value;
        return value.substring(0, limit) + end;
    }

    /**
     * Convert the given string to title case.
     */
    title(value: string): string {
        return value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    /**
     * Convert the given string to lower case.
     */
    lower(value: string): string {
        return value.toLowerCase();
    }

    /**
     * Convert the given string to upper case.
     */
    upper(value: string): string {
        return value.toUpperCase();
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     */
    slug(value: string, separator: string = '-'): string {
        return value
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, separator) // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, separator); // Replace multiple - with single -
    }

    /**
     * Determine if a given string contains a given substring.
     */
    contains(haystack: string, needles: string | string[]): boolean {
        if (typeof needles === 'string') {
            needles = [needles];
        }
        return needles.some(needle => haystack.includes(needle));
    }

    /**
     * Replace the first occurrence of a given value in the string.
     */
    replaceFirst(search: string, replace: string, subject: string): string {
        return subject.replace(search, replace);
    }

    /**
     * Replace the last occurrence of a given value in the string.
     */
    replaceLast(search: string, replace: string, subject: string): string {
        const lastIndex = subject.lastIndexOf(search);
        if (lastIndex === -1) return subject;
        return subject.substring(0, lastIndex) + replace + subject.substring(lastIndex + search.length);
    }
}

export const Str = new StrManager();

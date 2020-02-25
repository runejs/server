export const startsWithVowel = (str: string): boolean => {
    str = str.trim().toLowerCase();

    const firstChar = str.charAt(0);

    return (firstChar === 'a' || firstChar === 'e' || firstChar === 'i' || firstChar === 'o' || firstChar === 'u');
};

import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';



export function getUsername() {

    const stored = localStorage.getItem('username');
    if (stored) return stored;
    const shortName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: ' ',
        style: 'capital'
    });

    localStorage.setItem('username', shortName);
    return shortName;
}

export function saveUpdatedUsername(username: string) {
    localStorage.setItem('username', username);
}

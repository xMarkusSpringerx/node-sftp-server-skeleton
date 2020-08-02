export function doSomeAuthorization(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000)
    })
}

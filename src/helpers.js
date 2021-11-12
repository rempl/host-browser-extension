export function createIndicator() {
    const debugIndicator = document.createElement('div');
    debugIndicator.style = 'position:fixed;top:10px;left:10px;background:red;width:20px;height:20px;border-radius:50%';
    document.documentElement.appendChild(debugIndicator);
    return debugIndicator;
}

export function genUID(len) {
    function base36(val) {
        return Math.round(val).toString(36);
    }

    // uid should starts with alpha
    let result = base36(10 + 25 * Math.random());

    if (!len) {
        len = 16;
    }

    while (result.length < len) {
        result += base36(new Date * Math.random());
    }

    return result.substr(0, len);
}

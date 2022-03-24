export function makeResult(result: number, valid: boolean, scaleValid: boolean, scale: number): number {
    if (!valid)
        return Number.NaN
    if (!result)
        return Number.NaN
        
    if (!scaleValid)
        return result
    
    return result * Math.pow(10, scale)
}


export function deviation(avg: number, data: number[]): number {
    if (data.length < 1)
        return Number.NaN

    let ret = 0
    for (const i of data) {
        ret += Math.pow((avg - i), 2)
    }

    return Math.sqrt(ret / (data.length - 1))
}

export function cp(sigma: number, lsl: number, usl: number, deviation: number): number {
    if (usl === Number.NaN || lsl === Number.NaN || deviation === 0)
        return Number.NaN

    return (usl - lsl) / (sigma * deviation)
}

export function cpk(cp: number, average: number, lsl: number, usl: number): number {
    if (usl === Number.NaN || lsl === Number.NaN || usl === lsl)
        return Number.NaN

    const T = (usl - lsl) / 2
    return cp * (1 - Math.abs((average - (lsl + T)) / T))
}
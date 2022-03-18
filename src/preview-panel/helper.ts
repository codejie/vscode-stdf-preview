export function makeResult(result: number, valid: boolean, scaleValid: boolean, scale: number): number {
    if (!valid)
        return Number.NaN
    if (!result)
        return Number.NaN
        
    if (!scaleValid)
        return result
    
    return result * Math.pow(10, scale)
}

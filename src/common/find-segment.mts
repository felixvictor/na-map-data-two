export interface CurvePoint {
    time: number
    value: number
    tangentIn: number
    tangentOut: number
}

const findSegment = (time: number, points: CurvePoint[]): [CurvePoint, CurvePoint] | undefined => {
    for (let index = 0; index < points.length - 1; index++) {
        if (time >= points[index].time && time <= points[index + 1].time) {
            return [points[index], points[index + 1]]
        }
    }
    return undefined // time out of bounds
}

const hermiteInterpolation = (p0: CurvePoint, p1: CurvePoint, t: number): number => {
    const t2 = t * t
    const t3 = t2 * t

    const h00 = 2 * t3 - 3 * t2 + 1
    const h10 = t3 - 2 * t2 + t
    const h01 = -2 * t3 + 3 * t2
    const h11 = t3 - t2

    return h00 * p0.value + h10 * p0.tangentOut + h01 * p1.value + h11 * p1.tangentIn
}

export const getCurveValue = (time: number, points: CurvePoint[]): number | undefined => {
    const segment = findSegment(time, points)

    // If time is out of range
    if (!segment) {
        return undefined
    }

    const [p0, p1] = segment
    const t = (time - p0.time) / (p1.time - p0.time) // Normalize to [0,1]

    return hermiteInterpolation(p0, p1, t)
}

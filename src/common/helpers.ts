import { Data } from "@regionstats/models";

export function getRegionName(data: Data): string {
    if (data.i) {
        return data.r.toLowerCase() + ":" + data.i.toLowerCase();
    }
    return data.r.toLowerCase()
}
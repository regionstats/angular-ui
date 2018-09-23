import { Stat } from "@regionstats/models";
import { Calculation } from "./calculation";

export class StatContainer {
    hash?: string;
    calc?: Calculation;
    stat: Stat;
}
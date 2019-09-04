import {EnumWidgetType} from "../constants";
import { LeftBar } from './Business';


export default [
    {
        type: EnumWidgetType.mapControlBar,
        Widget: require("./MapControlBar").default
    },
    {
        type: EnumWidgetType.leftBar,
        Widget: LeftBar
    },
];

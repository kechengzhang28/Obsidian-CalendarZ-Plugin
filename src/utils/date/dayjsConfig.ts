import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Register dayjs plugins
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);

export default dayjs;

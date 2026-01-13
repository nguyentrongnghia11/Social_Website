import { v4 as uuidv4 } from "uuid"
export const generateDeviceId = () => {


    if (!localStorage.getItem("deviceId")) {
        const deviceId = uuidv4()
        localStorage.setItem("deviceId", deviceId)
    }
}
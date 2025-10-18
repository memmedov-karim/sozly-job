import { BASE_API_URLS } from "../constants/api";
import { FindIpResponse } from "../types";
import {createAxiosInstance} from "./axios"

export async function getUserLocation(ip: string): Promise<FindIpResponse | null> {
    console.log('Fetching location for IP:', ip);
    try {
        // const geoApi = createAxiosInstance(BASE_API_URLS.GEO_API);
        // const response = await geoApi.get(`/${ip}/?token=${process.env.FIND_IP_GEO_API_KEY || 'f853a9672fd4417fbf586cf0968cf49d'}`);
        return null;
    } catch (error) {
        console.error('Error fetching user location:', error);
        return null;
    }
}
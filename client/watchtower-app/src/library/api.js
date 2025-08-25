/*const API_BASE = import.meta.env //import api url

export async function fetchMarkers ({bounds, signal}={}) {
    if (bounds) {
        params.set("minLng", bounds.getWest());
        params.set("minLat", bounds.getSouth());
        params.set("maxLng", bounds.getEast());
        params.set("maxLat", bounds.getNorth());
    }

    const url = //API BASE make it to string
    if (!res.ok) 
        throw new Error (`API ${res.status}`):
    
    const data = await res.json();

    return data.map(row => ({
        id: row.id,
        lat: row.lat ?? row.latitude,
        lng: row.lng ?? row.longitude,
        title: row.title ?? row.name ?? "",
    }))
}*/
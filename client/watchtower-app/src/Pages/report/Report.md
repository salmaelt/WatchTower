## Report Features:

In this README we will explain the features within the Reports folder that allows the user to view, comment and create a report!

- `Report.jsx` : creating a report
- `LiveReports.jsx`: viewing reports
- `ReportThanks.jsx` : confirmation of reporting

## User Flow:

1. User opens Report page:
    - Views map (locked within london by defualt) with a simple form. 

    - Ability to tap the map where the incident took place or use the "Use my location" feature.

    - Fills in description anf time and the submits the report. 

### Icons
 ```
 const custIcon = L.icon ({
    iconUrl: markerPng,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
});
 ```

### `Report.jsx` - Creating a report:

- `useState`: form a state and its selected points

- `useRef`: holds a reference to the Leaflet map

`use`
```
const [form, setForm] = useState({
  locationText: "",  
  description: "",   
  time: "",          
});
```
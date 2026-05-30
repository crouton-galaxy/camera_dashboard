# Victoria Road Safety Dashboard

A policy-focused interactive dashboard for exploring speed camera deployment and road crash data across Victorian suburbs.

## Features

- **Choropleth map** of Victoria — colour suburbs by cameras/1k, crashes/1k, income, vehicle ownership, and more
- **Click any suburb** for a detailed profile: radar chart, camera breakdown, demographics, transport access
- **Camera Effectiveness** scatter — cameras per 1k vs crash rate per suburb
- **Equity Analysis** scatter — income vs camera density (are cameras distributed fairly?)
- **Camera Types by LGA** — stacked bar showing Mobile / DDS / Fixed breakdown per region
- **Filters** — LGA, Metro/Regional toggle, suburb search, map metric selector
- **Summary cards** — live-updating totals and averages for filtered selection

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Place your data files in `/public/`

```
public/
  data.csv              ← your CSV file (rename/copy it here)
  suburb-2-vic.geojson  ← download from:
                           https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-2-vic.geojson
```

**Download the GeoJSON:**
```bash
curl -o public/suburb-2-vic.geojson \
  "https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-2-vic.geojson"
```

Or download it manually and place it in `public/`.

### 3. Run the dev server
```bash
npm run dev
```

Open http://localhost:5173

### 4. Build for production
```bash
npm run build
```

## Data Join

The app joins your CSV's `Suburb` column (ALL CAPS) to the GeoJSON's `properties.vic_loca_2` field (Title Case) by normalising both to uppercase. Suburbs that don't match are simply shown without data (grey).

## Column Reference

| Column | Description |
|--------|-------------|
| `Suburb` | Suburb name (join key) |
| `Crashes Since 2020` | Total crashes recorded |
| `Population (2021 Census)` | ABS 2021 population |
| `Mobile` / `DDS` / `Fixed` | Camera counts by type |
| `Total` | Total cameras |
| `Cameras_Per_1000` | Pre-computed rate |
| `Median_Personal_Inc_Weekly` | Weekly income |
| `Percentage no vehicle` | % households, no car |
| `lgaregion` | LGA name |

## Tech Stack

- React 18 + Vite
- react-leaflet (CARTO dark tile layer)
- recharts (scatter, bar, radar charts)
- Tailwind CSS
- PapaParse (CSV parsing)
- Fonts: DM Serif Display, DM Sans, JetBrains Mono

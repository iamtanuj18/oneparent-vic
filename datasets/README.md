# OneParent VIC Datasets

Community demographics and geographic data for Victoria, Australia used by the OneParent VIC platform. Contains real data from government sources about schools, housing, population demographics, and community services.

## Dataset Summary

**13 CSV files** with **10,238 total records** across **4 data categories**:
- Community services and facilities (schools, housing, councils)
- Population trends and demographics by postcode/suburb
- Family research data from HILDA surveys 
- Geographic mapping data for Victorian suburbs

**Data Sources**: Australian Bureau of Statistics, Victorian Department of Education, HILDA Survey, Local Government Areas

## Key Datasets

### Community Services (4 files)
- **community_schools.csv** - 1,277 Victorian schools with locations and ratings
- **community_languages_lga.csv** - 283 language diversity statistics by council area
- **community_council_suburbs.csv** - 593 suburb to council mappings
- **community_rent_sale.csv** - 403 housing affordability data by suburb

### Population Trends (5 files) 
- **trends_victoria_one_parent_families.csv** - 41 single parent family statistics over time
- **trends_victoria_labour_families.csv** - 200 family employment statistics
- **trends_vic_pps_by_postcode.csv** - 3,511 demographic statistics by postcode
- **trends_vic_pps_by_postcode_with_suburb.csv** - 676 enhanced postcode data with suburb names
- **trends_pps_ts_data.csv** - 163 time series demographic trends

### Family Research (3 files)
- **hilda_childcare_usage.csv** - 80 childcare utilization patterns
- **hilda_housing_stress.csv** - 44 housing affordability stress indicators  
- **hilda_mental_health_recovery.csv** - 9 mental health recovery statistics

### Geographic Data (1 file)
- **vic_geo_vic_suburb_list.csv** - 3,161 complete Victorian suburb listings with postcodes

## How This Data is Used

**Community Match Feature**: Helps single parents find suitable neighborhoods using school ratings, housing affordability, and cultural diversity data.

**Find Events Feature**: Uses demographic data to recommend age-appropriate and culturally relevant family activities.

**Resource Hub**: Provides location-based access to childcare facilities, government support services, and community resources.

**Journey Map Feature**: Incorporates social indicators to offer context-aware milestone suggestions and region-specific support information.

## Data Format

- **Format**: UTF-8 encoded CSV files with headers
- **Size**: Approximately 400KB total  
- **Quality**: Government-sourced data, validated and cleaned
- **Privacy**: Aggregated statistics only, no personal information

## Using the Data

### Database Import
```bash
# Import into PostgreSQL database
cd aws/database
./setup-database.ps1
```

### Direct Analysis
- Open CSV files in Excel, R, Python, or any data analysis tool
- All files include headers and use standard CSV formatting
- Compatible with pandas, numpy, and other data science libraries

## Data Applications

- **Family Support Services**: Identify high-need areas and target services effectively
- **Policy Development**: Evidence-based policy using demographic trends and patterns  
- **Research**: Academic research on single parent demographics and community needs
- **App Development**: Location-based family support and demographic visualization tools
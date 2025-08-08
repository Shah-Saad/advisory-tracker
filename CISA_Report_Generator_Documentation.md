# CISA Advisory Report Generator

## Overview
The CISA Advisory Report Generator is an automated tool that allows administrators to generate monthly Excel reports of CISA (Cybersecurity and Infrastructure Security Agency) cybersecurity advisories.

## Features
- **Real-time Data**: Scrapes live data from the official CISA website
- **Monthly Reports**: Generate reports for any month and year
- **Excel Format**: Creates properly formatted Excel files ready for import
- **Preview Function**: Preview advisories before generating the full report
- **Automatic Download**: Generated reports are automatically downloaded to your computer

## How to Use

### 1. Access the Generator
1. Go to the Admin Dashboard
2. In the "Quick Actions" section, click on the "CISA Reports" button
3. The CISA Report Generator panel will open

### 2. Select Month and Year
1. Choose the desired month from the dropdown (January - December)
2. Select the year (available from 2020 to current year + 1)

### 3. Preview Advisories (Optional)
1. Click "Preview Advisories" to see what advisories are available
2. This shows the first 10 advisories and total count
3. No file is generated during preview

### 4. Generate Report
1. Click "Generate Excel Report" to create and download the Excel file
2. The file will be automatically downloaded to your Downloads folder
3. Filename format: `CISA_Advisories_[Month]_[Year].xlsx`

## Excel Report Structure
The generated Excel file contains the following columns:

| Column | Description | Auto-filled | Manual Entry |
|--------|-------------|-------------|--------------|
| S.No | Serial number | ✅ | |
| Date | Advisory publication date | ✅ | |
| Advisory ID | CISA advisory identifier | ✅ | |
| Title | Advisory title | ✅ | |
| Type | Type of advisory | ✅ | |
| Link | Direct link to CISA advisory | ✅ | |
| Vendor/OEM | Product vendor/manufacturer | | ✅ |
| Product | Product name | | ✅ |
| Risk Level | Risk assessment | | ✅ |
| Status | Processing status | ✅ (Default: Pending) | ✅ |
| Comments | Additional notes | | ✅ |

## Using the Generated Reports

### 1. Manual Completion
- Open the downloaded Excel file
- Fill in the "Vendor/OEM", "Product", and "Risk Level" columns
- Add any relevant comments
- Update the status as needed

### 2. Import to System
- Once completed, the Excel file can be imported into the Advisory Tracker system
- Use the standard upload functionality to import the data
- The system will recognize the format and process the entries

### 3. Team Assignment
- After import, entries can be assigned to specific teams
- Use the team management features to distribute work

## Tips and Best Practices

### 1. Monthly Processing
- Generate reports at the beginning of each month for the previous month
- This ensures all advisories for that month have been published

### 2. Data Validation
- Always review the scraped data for accuracy
- Cross-reference with the CISA website if needed
- The preview function helps verify data before generating reports

### 3. Regular Updates
- Run reports regularly to stay current with cybersecurity advisories
- Consider setting up a monthly schedule for report generation

### 4. Error Handling
- If no advisories are found, an empty template will be generated
- This can be useful for maintaining consistent reporting schedules

## Technical Details

### Data Source
- **Website**: https://www.cisa.gov/news-events/cybersecurity-advisories
- **Filter**: ICS (Industrial Control Systems) Advisories
- **Update Frequency**: Real-time (data is fetched live during generation)

### Supported Formats
- **Output**: Excel (.xlsx) format
- **Encoding**: UTF-8
- **Compatibility**: Microsoft Excel, Google Sheets, LibreOffice Calc

### Performance
- **Speed**: Typically 10-30 seconds depending on the number of advisories
- **Reliability**: Built-in retry logic and error handling
- **Rate Limiting**: Respectful delays between requests to CISA servers

## Troubleshooting

### Common Issues

#### No advisories found
- **Cause**: No CISA advisories published for the selected month
- **Solution**: Try a different month or verify the date selection

#### Network timeout
- **Cause**: Slow internet connection or CISA website unavailable
- **Solution**: Retry after a few minutes

#### Excel file won't open
- **Cause**: Browser blocking download or antivirus software
- **Solution**: Check Downloads folder, whitelist the application

#### Preview showing unexpected results
- **Cause**: CISA website structure may have changed
- **Solution**: Contact system administrator for updates

### Getting Help
If you encounter issues:
1. Try refreshing the page and attempting again
2. Check your internet connection
3. Verify the selected month/year is valid
4. Contact the system administrator if problems persist

## Security and Compliance

### Data Privacy
- No sensitive data is stored during the scraping process
- All data comes from publicly available CISA advisories
- Generated reports are stored locally on your computer

### Compliance
- Data source is official government cybersecurity advisories
- Suitable for compliance reporting and security assessments
- Maintains audit trail through generated timestamps

## Version History
- **v1.0**: Initial release with basic scraping and Excel generation
- **Future**: Planned features include automated scheduling and email delivery

---

*For technical support or feature requests, contact the system administrator.*

# Regionstats

# Types
All keys can be shortened to just the first letter of each word. 
* `data` can be `d`
* `value` can be `v`
* `regionName` can be `rn`

etc.

## Page

| key | type | required? | Notes |
| --- | ----- | --------- | ----- |
| stats | Stat[] | yes | |

## Stat

| key | type | required? | Notes |
| --- | ----- | --------- | ----- |
| title | string | yes | Should not specify the year if the `year` property is defined |
| data | Data[] | yes |  |
| regionName | string | yes | The name of the region that contains all the subregions. For example, if this stat was for the population of each U.S. state, this property should be `United States` |
| regionType | string | no | The type of all subregions. Should be something like `Country`, `State`, `City`, etc.
| year | number | no | |
| source | Source &#124; Source[] | no | *Not sure if I should allow an array here* |
| regionIntermediary | string | no | The type of each intermediary region if the subregions are not direct childs |
| regionMap | SVG | no | An SVG map of the region. The elements that that correspond to a region (usually `<path>`) should have a `name` attribute set to the region name. *I need to define how to delimit the parent region* |

## Data
| key | type | required? | Notes |
| --- | ----- | --------- | ----- |
| value | number | yes |  |
| region | string | yes | The name of the region for this data. Should match the corresponding svg path's `name` attribute (case insensitive comparison) | 
| parent | string | no | The name of the parent region for this data. Only needed when there are multiple regions with the same name (such as the city `Columbus`)| 

## Source

| key | type | required? | Notes |
| --- | ----- | --------- | ----- |
| title | string | yes | Should not specify the year if the `year` property is defined |
| year | number | no | |
| publisher | string | no | 
| url | string | no | Should be a publically available HTML document |
| file | File | no | |

# Example
```json
{
    stats: [
        {
            title: "Population"
            data: [
                {
                    region: "California",
                    value: 37253956
                },
                {
                    region: "Texas",
                    value: 25145561
                },
                {
                    region: "New York",
                    value: 19378102
                }
            ],
            regionName: "United States",
            regionType: "State",
            year: 2010,
            source: {
                title: "2010 U.S. Census",
                publisher: "U.S. Census Bureau"
            }
        },
        {
            t: "Homicides per Capita"
            d: [
                {
                    r: "Louisiana",
                    v: 10.3
                },
                {
                    r: "Mississippi",
                    v: 8.6
                },
                {
                    r: "Missouri",
                    v: 6.6
                }
            ],
            y: 2014,
            rn: "United States",
            rt: "State",
            rm: "B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9"
        },
    ],
}
```
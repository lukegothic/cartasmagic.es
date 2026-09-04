ejemplo url:
https://moxfield.com/decks/Cpj5UQ2EPUWkxcfFByNqPQ

Codigo en python
```
decklist = "https://moxfield.com/decks/Cpj5UQ2EPUWkxcfFByNqPQ"
id = decklist.replace("https://www.moxfield.com/decks/", "")
moxfield_api_url = "https://api.moxfield.com/v2/decks/all/{id}""
r = requests.get(moxfield_api_url.format(id))
with open("uploads/xxx", "wb") as f:
    f.write(r.content)
```


https://api2.moxfield.com/v2/decks/all/YF7U_dLd_UWh2rWacYMrvA/export?format=full&exportId=121ab355-619e-4124-abd2-b14b402d8715
https://api2.moxfield.com/v2/decks/all/YF7U_dLd_UWh2rWacYMrvA/export?arenaOnly=false&format=plaintext&exportId=121ab355-619e-4124-abd2-b14b402d8715&pricingProvider=cardmarket&ignoreFlavorNames=false
https://api.moxfield.com/v3/decks/all/YF7U_dLd_UWh2rWacYMrvA
# EmotiVault APIs
EmotiVault contains a set of helpful APIs to retrieve Emoticons from our database.

You can access the daily emoticon, retrieve a collection of emoticons using filters, or even get the full database of emoticons.

# How to Use
Read the documentation for specific APIs to see their intended domain of input parameters and outputs.

***For public use***: the webpage https://emotivault.onrender.com/api/ should be the base URL. Following the URL, you may enter [the listed API](#APIs) followed by any of their parameters as indicated in their documentation.

***For internal development***, simply type in [the listed API](#APIs) followed by their parameters indicated in their documentation. 

# APIs
1. **/emoticons**
2. **/emoticons/filter**
3. **/emoticons/search**
4. **/emoticons/emoticon-of-the-day**

# /emoticons
Returns the full list of emoticons, in the order as they are stored in the database.

You are able to specify a `limit` to the data if you don't want to receive the entire list, in which it will return the first `n` elements where `n` is the desired `limit`.

Alternatively, you can rely on the APIs pagination in which the API will return the data in pages. You can access this using the `page` parameter. The default size of a page is **20 items** but this can be manually adjusted using the `pageCount` parameter 

| Parameter | Example | Output |
| :---: | :---: | :---: |

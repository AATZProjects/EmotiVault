# EmotiVault APIs
EmotiVault contains a set of helpful APIs to retrieve Emoticons from our database.

You can access the daily emoticon, retrieve a collection of emoticons using filters, or even get the full database of emoticons.

# How to Use
Read the documentation for specific APIs to see their intended domain of input parameters and outputs.

***For public use***: the webpage https://emotivault.onrender.com/api/ should be the base URL. Following the URL, you may enter [the listed API](#APIs) followed by any of their parameters as indicated in their documentation.

***For internal development***, simply use `/api/` followed by [the listed API](#APIs) followed by their parameters indicated in their documentation.

# Errors
If you use an API and pass in invalid arguments, you will receive an error response with data name `error`. It will return a String detailing the reason why the parameter failed. No emoticon will be returned.

Refer to the [emoticonId API table](#/emoticons/{emoticonId}) to see an example of an error in the output.

# APIs
1. **/emoticons/{emoticonId}**
2. **/emoticons/all**
3. **/emoticons/filter**
4. **/emoticons/search**
5. **/emoticon-of-the-day**

# /emoticons/{emoticonId}
Returns all information of an emoticon given its ID.

If the input is empty or out of rang, an error will return.

Requesting an Emoticon given its ID will return the following information:
- emoticonId
- emoticonName
- emoticonString
- emoticonCategory
- emoticonMood

| Parameter | Example | Output |
| :---: | :---: | :---: |
| **emoticonId** | /api/emoticons/**21** | {"emoticonId": 21,<br>"emoticonName": "Classic Happy 2",<br>"emoticonString": ":)",<br>"emoticonCategory": "Classic",<br>"emoticonMood": "Happy"} |
| **No Args** | /api/emoticons/ | {"error": "ERROR: Emoticon ID can not be empty."} |
| **emoticonId** | /api/emoticons/**-1** | {"error": "ERROR: Emoticon ID is not in range."} |

# /emoticons/all
Returns the list of emoticons, sorted by emoticon ID by default. 

You are able to specify a `limit` to the data if you don't want to receive the entire list, in which it will return the first `n` elements where `n` is the desired `limit`.

Alternatively, you can rely on the APIs pagination in which the API will return the data in pages. You can access this by using the `page` parameter. The default size of a page is **20 items** but this can be manually adjusted using the `pageCount` parameter, in case you want to make the design friendly for smaller screens and interfaces.

The output of the JSON will be an array of results, each result will contain all information of the emoticon:

```
emoticonId:
    - emoticonId
    - emoticonName
    - emoticonString
    - emoticonCategory
    - emoticonMood
```

| Parameter | Example | Output |
| :---: | :---: | :---: |
| **No Args** | /api/emoticons/all | {1 {...}, 2 {...}, 3 {...}, 4 {...}, -> n{...}} |
| **page=** | /api/emoticons/all?**page=2** | {21 {...}, 22 {...}, -> 40 {...}} |
|**limit=** | /api/emoticons/all?page=3&**limit=2** | {41 {...}, 42 {...}} |
| **pageCount=** | /api/emoticons/all?**pageCount=3**&page=2 | {4 {...}, 5 {...}, 6 {...}} |

# /emoticon-of-the-day
The Emoticon of the Day API will return the website's current daily emoticon. The API will return the following information:

```
currentDate,
emoticonId:
    - emoticonId
    - emoticonName
    - emoticonString
    - emoticonCategory
    - emoticonMood
```

The API takes no parameters and only returns the daily Emoticon.

| Parameter | Example | Output |
| :---: | :---: | :---: |
| **No args** | /api/emoticon-of-the-day | "date": 2026-07-30,<br>"emoticonId": 21:<br>{"emoticonId": 21,<br>"emoticonName": "Classic Happy 2",<br>"emoticonString": ":)",<br>"emoticonCategory": "Classic",<br>"emoticonMood": "Happy"} |
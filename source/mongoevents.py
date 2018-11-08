"""
Date: 4/18/2018
Last Edited: 4/29/18
Description:
Library for handling the mongo database functionality for storing events.
"""

import sys
from pymongo import MongoClient  # Mongo database
import config  # Get config settings from credentials file

# The following imports are for creating unique tokens for each event
import binascii
import os

####
# App globals:
###
CONFIG = config.configuration()

MONGO_CLIENT_URL = "mongodb://{}:{}@{}:{}/{}".format(
    CONFIG.DB_USER,
    CONFIG.DB_USER_PW,
    CONFIG.DB_HOST,
    CONFIG.DB_PORT,
    CONFIG.DB)

if CONFIG.DEBUG is True:
    print("Using URL '{}'".format(MONGO_CLIENT_URL))

###
# Database connection per server process:
###
try:
    dbclient = MongoClient(MONGO_CLIENT_URL)
    db = getattr(dbclient, str(CONFIG.DB))
    collection = db.resources
except:
    print("Failure opening database. Is Mongo running? Correct password?")
    sys.exit(1)


###
# Mongo Event Functions
###

def mongo_addEvent(event):
    """
    Adds new event to the mongo database:
    Gets: event from addEvent in flask_main.py.
    Calls: insert_one() to insert event into database.
    Returns: token of event if successful or
    status code if it was unsuccessful.
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    if event["start_date"] > event["end_date"]:     # if start date is after end date
        return 416      # return error code

    token = generate_key()      # generate unique token for new event
    res = collection.insert_one(        # call to insert event below into database
        {
            "title": event["title"],    # Type: string
            "category": event["category"],  # Type: string
            "start_date": event["start_date"],  # Type: iso string
            "end_date": event["end_date"],  # Type: iso string
            "location": event["location"],  # Type: string
            "description": event["description"],    # Type: string
            "token": token  # unique token of event, length 20
        })
    if res.acknowledged is not True:    # if add was unsuccessful
        return 412      # return error code
    else:   # if add was successful
        return token    # return token of added event

def mongo_editEvent(event):
    """
    Replaces event in the mongo database with a new one:
    Gets: event from editEvent in flask_main.py.
    Calls: find_one_and_replace() to find and replace
    specific event in database using new event.
    Returns: True if successful and False if unsuccessful.
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    if event["start_date"] > event["end_date"]:     # if start date is after end date
        return 416  # return error code

    res = collection.find_one_and_replace(      # call to find and replace event in database
        {"token": event["token"]},      # uses token of provided event to find it
        {
            "title": event["title"],    # Type: string
            "category": event["category"],  # Type: string
            "start_date": event["start_date"],  # Type: iso string
            "end_date": event["end_date"],  # Type: iso string
            "location": event["location"],  # Type: string
            "description": event["description"],    # Type: string
            "token": event["token"]     # unique token of event, length 20
        }
        )

    if res["token"] == event["token"]:  # if returned event has same token
        return True     # return True
    else:   # if unsuccessful
        return 413      # return error code


def mongo_delEvent(token):
    """
    Finds and deletes specific event in the database:
    Gets: token from delEvent in flask_main.py.
    Calls: find() to get specific event, and delete_one()
    to delete specific event from the database.
    Returns: True if successful and False if unsuccessful
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    for record in collection.find({"token": token}):    # find events that have provided token
        ret = collection.delete_one(record)     # delete found event
        if ret.deleted_count is 1:  # if successful
            return True     # return True
        else:   # if unsuccessful
            return False    # return False

def mongo_getEvent(token):
    """
    Finds and returns specific event in the database:
    Gets: token from getEvent in flask_main.py.
    Calls: find_one() to get specific event in database.
    Returns: found event if there was one, or
    status code if it was unsuccessful.
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    record = collection.find_one({"token": token})  # find event that has provided token
    if record == None:  # if there are no events
        return 415  # return error code
    else:   # if event found
        del record['_id']
        return record   # return event

def mongo_getRangeEvents(start, end):
    """
    Finds and returns events with in a specific range:
    Gets: start date and end date from getRangeEvents in flask_main.py.
    Calls: find() to get events with start times between
    start and end dates within the database.
    Returns: found events if there are any.
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    records = []

    found_events = collection.find(     # call to find events with start date in range:
        {"start_date": {"$gte": start, "$lt": end}}
    )   # greater or equal to start date, less than or equal to end date
    for record in found_events: # for each event found, add to list
        del record['_id']
        records.append(record)
    return records  # return list of found events

def mongo_getAllEvents():
    """
    Finds and returns all events in the database:
    Calls: find() to get all events from database.
    Returns: All events found if there are any.
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    records = []
    for record in collection.find():    # get all events in database
        del record['_id']
        records.append(record)  # add each event to list
    return records  # return list of all events in database

def mongo_getFieldEvents(field, value):
    """
    Finds and returns events that share a specific value:
    Gets: field and value from getFieldEvents in flask_main.py
    Calls: find() to get events which share the same value in
    the specific field in the database.
    Returns: Any events found if there are any.
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    records = []
    for record in collection.find({field: value}):  # call to find events with share the value in specific field
        del record['_id']
        records.append(record)  # add each event to list
    # Sort the records by name:
    records.sort(key=lambda i: i[field])    # sort list by value
    return records  # return list

def mongo_getFieldList(field):
    """
    Retrieves all unique values for a specific field:
    Gets: field from getFieldList in flask_main.py
    Calls: distinct() all unique values in specific field
    to delete specific event from the database.
    Returns: Any found unique values for specific field
    Reference: http://api.mongodb.com/python/current/api/pymongo/collection.html
    """
    all_types = collection.distinct(field)  # call to get all unique values in specific field
    result = { field : all_types}
    return result   # return all unique values found

def mongo_delAllEvents():
    """
    Deletes all events in database:
    Calls: mongo_FieldList() to get all unique tokens
    in the database, and mongo_delEvent() for each token.
    Returns: True if successful and False if unsuccessful
    """
    tokens = mongo_getFieldList("token")    # call to get all unique tokens in database
    for token in tokens['token']:   # for each unique token
        mongo_delEvent(token)   # delete each event with that token
    result = mongo_getFieldList("token")    # call again to get each unique token
    if len(result["token"]) is 0:   # if database is empty
        return True     # return True
    else:   # if database is not empty
        return False    # return False

###
# Utility Functions
###

def generate_key():
    """
    Generates and returns a token of length 20
    """
    return binascii.hexlify(os.urandom(10)).decode()    # returns randomly generated token of length 20

###
# Library testing
###

def mongo_tempTest():
    """
    Test function for all functions above.
    Clears all events from the database
    for a controlled environment in tests.
    Returns: list of tests ran.
    """
    mongo_delAllEvents()

    testResults = {
        "addEvent" : None,
        "delAllEvents" : None,
        "getRangeEvents" : None,
        "getEvent" : None,
        "getAllEvents" : None,
        "getFieldEvents" : None,
        "getFieldList" : None,
        "editEvent" : None,
        "delEvent" : None,
    }

    dummy1 = {
        "title": "test1",
        "category": "Sport",
        "start_date": "2018-04-13T16:30:00.000Z",
        "end_date": "2018-04-13T19:00:00.000Z",
        "location": "test",
        "description": "fsafdsafjlsdkj fkjsdak fhsd  afasd fsad fsad fsadfsdafsdfsdahjfhksdahfhsadkfsadjk"
    }
    dummy2 = {
        "title": "test2",
        "category": "School",
        "start_date": "2018-04-14T16:30:00.000Z",
        "end_date": "2018-04-14T19:00:00.000Z",
        "location": "test",
        "description": "sadfsdafsdfsdahjfhksdahfhsadkfsadjk"
    }

    mongo_addEvent(dummy1)
    mongo_addEvent(dummy2)
    assert mongo_delAllEvents() == True
    assert len(mongo_getAllEvents()) == 0
    testResults["delAllEvents"] = True

    result = mongo_addEvent(dummy1)
    assert result != 412
    mongo_delAllEvents()
    testResults["addEvent"] = True

    mongo_addEvent(dummy1)
    records = mongo_getRangeEvents(dummy1["start_date"], dummy1["end_date"])
    assert len(records) == 1
    mongo_delAllEvents()
    testResults["getRangeEvents"] = True

    token = mongo_addEvent(dummy1)
    record = mongo_getEvent(token)
    assert record != 415
    assert record["title"] == dummy1["title"]
    mongo_delAllEvents()
    testResults["getEvent"] = True

    mongo_addEvent(dummy1)
    mongo_addEvent(dummy2)
    records = mongo_getAllEvents()
    assert len(records) == 2
    mongo_delAllEvents()
    testResults["getAllEvents"] = True

    mongo_addEvent(dummy1)
    records = mongo_getFieldEvents("title", "test1")
    assert len(records) == 1
    mongo_delAllEvents()
    testResults["getFieldEvents"] = True

    mongo_addEvent(dummy1)
    mongo_addEvent(dummy2)
    result = mongo_getFieldList("title")
    assert dummy1["title"] in result["title"]
    assert dummy2["title"] in result["title"]
    mongo_delAllEvents()
    testResults["getFieldList"] = True

    token = mongo_addEvent(dummy1)
    dummy3 = dummy2
    dummy3["token"] = token
    result = mongo_editEvent(dummy3)
    assert result == True
    result = mongo_getEvent(token)
    assert dummy3 == result
    mongo_delAllEvents()
    testResults["editEvent"] = True

    token1 = mongo_addEvent(dummy1)
    token2 = mongo_addEvent(dummy2)
    assert mongo_delEvent(token1) == True
    assert mongo_delEvent(token2) == True
    mongo_delAllEvents()
    testResults["delEvent"] = True

    return testResults

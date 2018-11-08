"""
flask_main.py
Date: 4/11/2018
Last Edited: 4/29/2018
Description:
Creates the server application to serve the index file to the client user as well
as handle server logic and wrap the MongoDB calls
"""

import logging
import flask  # Web server tool.
from mongoevents import *  # Mongo code
import config  # Get config settings from credentials file
import csv  # this is for backup function
import datetime  # This is for backup function

####
# App globals:
###
CONFIG = config.configuration()

app = flask.Flask(__name__)
app.secret_key = CONFIG.SECRET_KEY

###
# URL AJAX Routing
###

@app.route("/_addEvent")
def addEvent():
    """
    Adds new event to the mongo database:
    Gets: event based on args past to it from front end.
    Calls: helper function to add new event to database.
    Returns: token of event if it was added and status
    code based on if it was successful or not.
    """
    app.logger.debug("_addEvent")
    # Get Event information

    event = {
        "title": flask.request.args.get("title", type=str),  # Type: string
        "category": flask.request.args.get("category", type=str),  # Type: string
        "start_date": flask.request.args.get("start_date", type=str),  # Type: iso string
        "end_date": flask.request.args.get("end_date", type=str),  # Type: iso string
        "location": flask.request.args.get("location", type=str),  # Type: string
        "description": flask.request.args.get("description", type=str),  # Type: string
    }

    ret = mongo_addEvent(event)  # Call to helper function, passes event above

    if ret != 412 or ret != 416:  # check for error codes
        app.logger.debug("Inserted")
        result = {"message": "Event Inserted!",  # message for success
                  "status": 201,  # status code for success
                  "token": ret  # token of added event
                  }
        return flask.jsonify(result=result)
    else:  # return error codes with message
        app.logger.debug(ret)
        result = {"error": "Failed to Add Event",  # error message
                  "status": ret  # status code returned from helper
                  }
        return flask.jsonify(result=result)


@app.route("/_editEvent")
def editEvent():
    """
    Replaces event in the mongo database with a new one:
    Gets: event based on args past to it from front end.
    Calls: helper function to replace old event with
    new event on database.
    Returns: status code based on if it was successful or not.
    """
    app.logger.debug("_editEvent")
    event = {
        "title": flask.request.args.get("title", type=str),  # Type: string
        "category": flask.request.args.get("category", type=str),  # Type: string
        "start_date": flask.request.args.get("start_date", type=str),  # Type: iso string
        "end_date": flask.request.args.get("end_date", type=str),  # Type: iso string
        "location": flask.request.args.get("location", type=str),  # Type: string
        "description": flask.request.args.get("description", type=str),  # Type: string
        "token": flask.request.args.get("token", type=str)  # unique token for event, length 20
    }

    ret = mongo_editEvent(event)  # Call to helper function, passes event above

    if ret is True:  # check to see if it was successful
        app.logger.debug("Event edited")
        result = {"message": "Event Edited!",  # message for success
                  "status": 202,  # status code
                  "token": ret  # token of edited event
                  }
        return flask.jsonify(result=result)  # return result to front end

    else:  # if it wasn't successful
        app.logger.debug("Failed to edit event")
        result = {"error": "Failed to edit Event",  # error message
                  "status": ret  # status code returned from helper
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_delEvent")
def delEvent():
    """
    Finds and deletes specific event in the database:
    Gets: token sent to it from front end.
    Calls: helper function to find and delete specific event
    based on token.
    Returns: status code based on if it was successful or not.
    """
    app.logger.debug("_delEvent")
    # Get token
    token = flask.request.args.get("token", type=str)  # database token of length 20

    ret = mongo_delEvent(token)  # Call to helper function, passes token from above

    if ret is True:  # if successful
        app.logger.debug("Deleted")
        result = {"message": "Event Deleted!",  # message for success
                  "status": 203  # status code for success
                  }
        return flask.jsonify(result=result)

    else:  # if unsuccessful
        app.logger.debug(ret)
        result = {"error": "Failed to Delete Event",  # error message
                  "status": 414  # status code
                  }
        return flask.jsonify(result=result)


@app.route("/_getEvent")
def getEvent():
    """
    Finds and returns specific event in the database:
    Gets: token sent to it from front end.
    Calls: helper function to find and return specific event
    based on the token.
    Returns: the event if found to frontend along with
    status code based on if it was successful or not.
    """
    app.logger.debug("_getEvent")
    # Get token
    token = flask.request.args.get("token", type=str)  # database token of length 20

    ret = mongo_getEvent(token)  # Call to helper function, passes token from above

    if ret != 415:  # if successful
        app.logger.debug("Retrieved Event")
        result = {
            "message": "Event Retrieved!",  # message for success
            "event": ret,  # event returned from helper
            "status": 204  # status code for success
        }
        return flask.jsonify(result=result)  # return result to front end

    else:  # if unsuccessful
        app.logger.debug("Failed to get event")
        result = {"error": "Failed to get Event",  # error message
                  "status": ret  # status code from helper
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_getRangeEvents")
def getRangeEvents():
    """
    Finds and returns events with in a specific range:
    Gets: start date and end date from frontend.
    Calls: helper function retrieve any events found between
    start date and end date.
    Returns: list of events if there was any, and
    status code based on if it was successful or not.
    """
    app.logger.debug("_getRangeEvents")
    # Get start and end info
    start = flask.request.args.get("start_date", type=str)  # iso string for start date of range
    end = flask.request.args.get("end_date", type=str)  # iso string for end date of range

    events = mongo_getRangeEvents(start, end)  # Call to helper for list of events, passes start and end dates

    if len(events) > 0:  # if list contains events
        app.logger.debug("Got Events")
        result = {
            "message": "Events Retrieved!",  # message for success
            "num": len(events),  # number of events
            "events": events,  # list of events returned from helper
            "status": 204  # status code for success
        }
        return flask.jsonify(result=result)  # return result to front end

    else:  # if no events returned
        app.logger.debug("Retrieved No Events")
        result = {"error": "Retrieved No Events",  # error message
                  "status": 417  # error code
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_getAllEvents")
def getAllEvents():
    """
    Finds and returns all events in the database:
    Calls: helper function to get all events in database.
    Returns: list of events if there was any, and
    status code based on if it was successful or not.
    """
    app.logger.debug("_getAllEvents")
    # No arguments

    events = mongo_getAllEvents()  # Call to helper to retrieve all events, passes nothing

    if len(events) > 0:  # if list contains events
        app.logger.debug("Got Events")
        result = {
            "message": "Events Retrieved!",  # message for success
            "num": len(events),  # number of events
            "Events": events,  # list of events
            "status": 204  # status code for success
        }
        return flask.jsonify(result=result)  # return result to front end

    else:
        app.logger.debug("Retrieved No Events")
        result = {"error": "Retrieved No Events",  # error message
                  "status": 418  # error code
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_getFieldEvents")
def getFieldEvents():
    """
    Finds and returns events that share a specific value:
    Gets: field name and value to find in the field from frontend.
    Calls: helper function both and gets all events found who have
    the same field value.
    Returns: list of events if there was any,
    and status code based on if it was successful or not.
    """
    app.logger.debug("_getFieldEvents")
    # Get request field
    field = flask.request.args.get("field", type=str)  # string: name of field
    value = flask.request.args.get("value", type=str)  # value of field

    events = mongo_getFieldEvents(field, value)  # Call helper to get list of events, passes field and value

    if len(events) > 0:  # if list contains events
        app.logger.debug("Got Events")
        result = {
            "message": "Events Retrieved!",  # message for success
            "num": len(events),  # number of events
            "Events": events,  # list of events
            "status": 204  # status code for success
        }
        return flask.jsonify(result=result)  # return result to front end

    else:
        app.logger.debug("Could not find events")
        result = {"error": "Retrieved No Events",  # error message
                  "status": 415  # error code
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_getFieldList")
def getFieldList():
    """
    Retrieves all unique values for a specific field:
    Gets: field name from frontend.
    Calls: helper function the field name and gets all values
    found in that field. Ex: {"category" : "Sport", "Class", etc }
    Returns: list of values if there was any and
    status code based on if it was successful or not.
    """
    app.logger.debug("_getFieldList")
    # Get request field
    field = flask.request.args.get("field", type=str)  # name of field

    fieldList = mongo_getFieldList(field)  # Call helper to get list of values in field, passes field name

    if len(fieldList) > 0:  # if list has values
        app.logger.debug("Got List")
        result = {
            "message": "List Retrieved!",  # message for success
            "num": len(fieldList),  # number of unique values
            "list": fieldList,  # list of unique values
            "status": 205  # status code for success
        }
        return flask.jsonify(result=result)  # return result to front end

    else:  # if list was empty
        app.logger.debug("Empty field list Returned")
        result = {"error": "Empty Field List Returned",  # error message
                  "status": 419  # error code
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_delAllEvents")
def delAllEvents():
    """
    Deletes all events in database:
    Calls: helper function to delete all events.
    Returns: status code based on if it was successful or not.
    """
    result = mongo_delAllEvents()  # Call helper function to clear database, passes nothing

    if result == True:
        app.logger.debug("All events deleted")
        result = {"message": "All Events Deleted",  # message for success
                  "status": 206  # status code for success
                  }
        return flask.jsonify(result=result)  # return result to front end

    else:
        app.logger.debug("Not all events were deleted")
        result = {"error": "Database is not Empty",  # error message
                  "status": 420  # error code
                  }
        return flask.jsonify(result=result)  # return result to front end


@app.route("/_backup")
def backup_data():
    """
    Creates a backup .csv file which contains all events in
    the database, separated by tabs for each attribute and
    newline between each event.
    Returns file to frontend for download, even if there
    are no events in the database (empty file)
    """
    now = datetime.datetime.now()   # get the current date
    events = mongo_getAllEvents()   # get all events in the database
    events = sorted(events, key=lambda k: k['start_date'])
    fileID = 0  # file id for keeping track of backups with the same date

    fileName = "backup-{year}-{month}-{day}".format(
            year = str(now.year), month = str(now.month),day = str(now.day)) # creating the filename

    while (os.path.exists( fileName + '-' + str(fileID) + ".csv")):     # checking to see if name exists
        fileID += 1

    fileNameWithID = fileName + '-' + str(fileID) + ".csv"  # file name with ID on the end
    fileName = fileName + ".csv"    # file name without ID on the end
    size = len(events)  # how many events there are

    try:
        with open(fileNameWithID, 'w', newline = '') as f:
            theWriter = csv.writer(f)   # open file to write
            for i in range(size):   # for each event, put a tab between each element
                event = events[i]
                eventstr = "{date}\t{start}\t{end}\t{title}\t" \
                           "{category}\t{location}\t{description}\t".format(
                            date=event['start_date'][:10],
                            start=event['start_date'][10:],
                            end=event['end_date'][10:],
                            title=event['title'],
                            category=event['category'],
                            location=event['location'],
                            description=event['description'],
                            )
                theWriter.writerow([eventstr])  # write that event as a row
        f.close()   # close file

        app.logger.debug("Database backed up")

        if fileID == 0: # if the ID is 0, send to frontend without the ID
            return flask.send_file(fileNameWithID, as_attachment=True, attachment_filename=fileName)
        else:   # else send it with the ID on the end
            return flask.send_file(fileNameWithID, as_attachment=True, attachment_filename=fileNameWithID)

    except:
        app.logger.debug("Database backup failed")

###
# Pages
###

# Main index page
@app.route("/")
@app.route("/index")
def index():
    app.logger.debug("Main page entry")
    # return flask.render_template('index.html')
    return app.send_static_file('index.html')  # provide index page for front end


# Error page(s)
@app.errorhandler(404)
def page_not_found(error):
    app.logger.debug("Page not found")
    return flask.render_template('page_not_found.html',
                                 badurl=flask.request.base_url,
                                 linkback=flask.url_for("index")), 404


if __name__ == "__main__":
    app.debug = CONFIG.DEBUG
    app.logger.setLevel(logging.DEBUG)
    # app.logger.debug(mongo_tempTest())
    app.run(port=CONFIG.PORT, host="localhost")

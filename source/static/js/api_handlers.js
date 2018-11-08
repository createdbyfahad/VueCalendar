/**
 * Date: 4/18/2018
 * Last Edited: 4/29/2018
 * api_handlers.js has all functions needed to connnect with the server,
 * and it's resposible for providing the interface with data needed
 * from the back end
 * It's suited to deal with a flask server hosted the same address
 * 
 */


/**
 * a getter that will get all events from the server
 * it needs no information and will return either an error
 * code or an array with all events
 * @return {Array}
 */
function api_get_all() {
	var all_events = false
	$.getJSON("/_getAllEvents", 
		{}, function (data) {
			result = data.result; // will use the result variable (for Flask)
			if (result.status == 418) {
				// there are no events
				// return empty array (no events)
				all_events = []
			} else if (result.status == 204){
				// there are events, so return it
				all_events = result.Events; // Array of events
			}
		});
	
	// if somwthing went wrong then return false
	return all_events;
}


/**
 * will send to server the event information provided in event, and check 
 * the result. if success, then return the event token provided by server
 * @param  {obj}
 * @return {string}
 */
function api_add_event(event) {
	
	// prepare the event data
	new_event = event // a new variable so that it doesn't affect the source variable
	// change date formats to ISO
	new_event.start_date = new_event.start_date.toISOString()
	new_event.end_date = new_event.end_date.toISOString()

	var ret = false

	$.getJSON("_addEvent", // URL
		// Sent Object - build it here 
		new_event,
		function (data) {
			result = data.result
			// check if the event is added or not
			if(result.status == 416 ){
				// there is something wrong with data validation
				ret = 416
			}else if(result.status == 201){
				// the event is added, return the token
				ret = result.token
			}
		});

	// if somwthing went wrong then return false
	return ret
}


/**
 * provided the new event information (must have a token in the object)
 * it will send it to the server and return 413 if validation is failed
 * or the event token (same token)
 * @param  {obj}
 * @return {int}
 */
function api_edit_event(event) {

	// prepare the event data
	new_event = event // a new variable so that it doesn't affect the source variable
	// change date formats to ISO	
	new_event.start_date = new_event.start_date.toISOString()
	new_event.end_date = new_event.end_date.toISOString()

	var ret = false

	$.getJSON("_editEvent", // URL
		// Sent Object - Get all fields to edit
		// Token used to identify 
		new_event,
		function (data) {
			var result = data.result;
			// If error field exists
			if (result.status == 413) {
				// there is something wrong with data validation
				ret = 413
			}else if(result.status == 202){
				// the event is added, return the token
				ret = result.token
			}
		});

	return ret
}

/**
 * will request the server to delete the provided event id
 * return true if successful, false otherwise
 * @param  {int}
 * @return {boolean}
 */
function api_delete_event(event_id) {
	
	var ret = false
	
	$.getJSON("/_delEvent",
		{
			token: event_id // for the server to find the event
		},
		function (data) { 
			var res = data.result;
			if (res.status == 203) {
				// the delete successed, so return true
				ret = true
			}
	});

	// failed, so return false
	return ret
}


/**
 * used for deleting all events in the calender.
 * return true if successful, false otherwise
 * @return {boolean}
 */
function api_delete_all_events() {
	
	var ret = false

	$.getJSON("/_delAllEvents",
		{}, // no information need to be sent
		function (data) { 
			var res = data.result;
			if (res.status == 206) {
				// if success, return true
				ret = true
			}
	});

	// failed, return false
	return ret
}
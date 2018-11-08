/**
 * Date: 4/18/2018
 * Last Edited: 4/29/2018
 * Author: Fahad Alarefi
 * app.js is the main engine behind the Calender app it's used to move and operate
 * the html/ajax static page. It will be using an api helper funcitons and they
 * can be found in the api_handlers.js file.
 */



/**
 * STATIC VARIALBLES	
 */
var msg_data_validation_failed = "Server: form validation has failed"
var msg_something_went_wrong_server = "Server: something went wrong (can't connect)"
var msg_cant_delete_server = "Server: failed deleting the event"
var msg_delete_all_confirm = "Are you sure want to delete all events in the database? Total events: "
var msg_conflicts_confirm = "There are conflicts in events schedule, do want to delete conflicted events? Total conflicts: "
var msg_conflicts_change_time = "There are conflicts, please change start or end times"
var msg_title_validation = "Title is required and must be 32 charachters or less"
var msg_location_validation = "Location is required and must be 32 charachters or less"
var msg_details_validation = "Details cannot be larger than 128 charachters"
var msg_choose_times = "Please choose times for event"
var msg_event_start_before = "Event end time must be after start time"
var init_alert = {type: null, message: ""}
var time_vars = [7,24,4]
var current_day = moment().hours(0).minutes(0).seconds(0).millisecond(0)


// this is used for AJAX to be able to return eagrly
$.ajaxSetup({
	async: false
});


/**
 * HELPER FUNCTIONS
 */


/**
 * the function should create an array with each day in the week, mid_day being the one in the middle.
 * @param  {Moment}
 * @return {Array}
 */
function get_week_data(mid_day){
	return [moment(mid_day).subtract(3, 'days'), moment(mid_day).subtract(2, 'days'), moment(mid_day).subtract(1, 'days'), 
			mid_day, moment(mid_day).add(1, 'days'), moment(mid_day).add(2, 'days'), moment(mid_day).add(3, 'days')]
} 



/**
 * should return a very long array (7*24*4) initilized to false
 * needs a time amount array [days, hours, sections]
 * @param  {[days, hours, slots per hour]}
 * @return {[type]}
 */
function get_empty_cells(time_vars){
	var slots = []
	for(var daynumber = 0; daynumber < time_vars[0]; daynumber++){
		for(var hour = 0; hour < time_vars[1]; hour++){
			for(var section = 0; section < time_vars[2]; section++){
				// for every slot in every hour in every day of a week, add a false variable
				slots.push(false)
			}
		}
	}

	// this array should be the size of 7*24*4 filled with false
	return slots
}


/**
 * will get the time index in the slots. it does all calculations needed to find
 * the index number for array access
 * @param  {Moment}
 * @param  {Moment}
 * @param  {Moment}
 * @param  {Array}
 * @return {int}
 */
function get_time_index(start_day, end_day, mid_of_week, time_vars){

	// get the difference in days between start and mid week (rational to mid week)
	var day_ind = Math.floor(3 + start_day.diff(mid_of_week, 'days', true))
	var end_day_ind = Math.floor(3 + end_day.diff(mid_of_week, 'days', true))
	
	// get the amount of hours in start_day (ex: 06:00pm => 18)
	var hour_ind = start_day.hours()
	// round the minute value to nearest 15
	var min_ind = start_day.minutes()/15

	// in case the event's start_day or end_date is not in the week's date
	// return false
	if ((end_day_ind < 0 && day_ind < 0) || day_ind > time_vars[0]-1){
		return false
	}

	return ((time_vars[1]*time_vars[2])*day_ind) + (hour_ind*time_vars[2]) + min_ind
}


/**
 * used to map events to their prospective cells the array. will fill every event occuring at the slot
 * with the corresponding event's token
 * @param  {Array}
 * @param  {Array}
 * @param  {Moment}
 * @return {Array}
 */
function map_events(events, slots, mid_of_week){
	// foreach event in provided events array
	for (var i = 0; i < events.length; i++){

		var event = events[i];

		// get the event length in minutes and round it to 15
		var event_length_min = Math.floor(event.end_date.diff(event.start_date, 'minute')/15)

		// get the slots location
		var start_ind = get_time_index(event.start_date, event.end_date,mid_of_week, time_vars)

		if(start_ind !== false){
			for(var m=0; m < event_length_min; m++){
				// if there is an event happening at that time slot
				slots[start_ind+m] = events[i].token; // assign the slot with event id
			}
		}
	}

	return slots
}

/**
 * a looker for an event by id in a provided events array
 * @param  {Array}
 * @param  {String}
 * @return {Obj}
 */
function get_event(events, event_id){
	// a getter that returns the event with id event_id, otherwise false
	for (var i = events.length - 1; i >= 0; i--) {
		if(events[i].token == event_id){
			return events[i]
		}
	}

	// otherwise
	return false
}

/**
 * helper that generates an object for the error reporting system
 * for type => 0: success, 1: warning, 2: error
 * @param  {int}
 * @param  {String}
 * @return {obj}
 */
function get_alert_obj(type, message){
	alert_types = ['alert alert-primary', 'alert alert-warning', 'alert alert-danger']
	return {type: alert_types[type], message: message}
}

/**
 * a validator for the add/update form. it checks every data with
 * the condition specified in API documentation
 * @param  {Obj}
 * @return {Array}
 */
function validate_form(data){
	var errors = []
	if(data.title.length < 1 || data.title.length > 32){
		errors.push(msg_title_validation)
	}

	if(data.location.length < 1 || data.location.length > 32){
		errors.push(msg_location_validation)
	}

	if(data.details && data.details.length > 128){
		errors.push(msg_details_validation)
	}

	if(data.start_time == null || data.end_time == null){
		errors.push(msg_choose_times)
	}else if(data.end_time.diff(data.start_time) <= 0){
		// make sure that start is before end
		errors.push(msg_event_start_before)
	}

	return errors
}







/**
 * Application starts from here
 */


// get the events ready
var all_events = api_get_all()

if(all_events === false){
	// something wrong with server
	init_alert = get_alert_obj(2, msg_something_went_wrong_server)
	// print message to the user
	all_events = []
}else{
	//need to convert event dates to Moment format
	for (var i = 0; i < all_events.length; i++){
		all_events[i].start_date = moment(all_events[i].start_date)
		all_events[i].end_date = moment(all_events[i].end_date)
	}
}



// a variable used to check the status of cell in the table.
var slot_status = get_empty_cells([7, 24, 4])
// set each event data to corresponding slot
slots_status = map_events(all_events, slot_status, current_day) 
Vue.component('slot-cell', {
	props: ['date', 'event'],
	template: '<td class="grid-event-on" v-if="event" v-bind:data-event="event" v-on:click="setView(event)"></td><td v-else></td>',
	methods: {
		// used when the user clicks a cell that has event information
		setView: function(event_id){
			this.$emit('view-event', event_id)
			$('#event_view').popup('show');
		}
	}
});


Vue.component('process-event-form', {
	data: function () {
	    return this.initAddEvent() // populate the form inputs with information
	},
	props: ['chosen_day', 'update_event'],
	methods: {
		process_event: function(){
			// first validate all data
			
			// check if the all_day is clicked, then reset start and end times
			if(this.all_day){
				this.start_time = moment(this.chosen_day).hours(0).minutes(0).seconds(0).millisecond(0) // from 12am
				this.end_time = moment(this.chosen_day).hours(0).minutes(0).seconds(0).millisecond(0).add(1, 'days') // to 12am next day
			}

			// validate the user's data entered
			this.errors = validate_form(this)

			//check if there are conflicts with other events
			var conflicts = this.$parent.get_conflicts(this)


			// if there are conflicts
			if(conflicts.length > 0){
				// there are conflicts
				 
				// check with user, if they want to delete them
				if(confirm(msg_conflicts_confirm + (conflicts.length))){
					// delete conflicts
					for(var i = conflicts.length - 1; i >= 0; i--) {
						this.$parent.delete_event(conflicts[i])
					}
				}else{
					// if the user doesn't want to delete, then add form error telling them to change time/date
					this.errors.push(msg_conflicts_change_time)
				}
			}


			// if there are validation errors then don't process the form
			if(this.errors.length == 0){

				// prepare the event object for update or add
				var event = {
						title: this.title,
						start_date: this.start_time,
						end_date: this.end_time,
						location: this.location,
						description: this.details,
						token: null
					};

				// check if the user wants to edit or add
				// if edit, then this.update_event must have the event data
				if(this.update_event){

					// add the token
					event.token = this.update_event.token

					// prepare it for sending to server
					
					// need to use assign to eliminate data change from function
					var res = api_edit_event(Object.assign({}, event)) 
					
					if(res === false){
						// something else went wrong
						// notify the user with top alert
						this.$emit('new-alert', get_alert_obj(2, msg_something_went_wrong_server))
					}else if(res == 413){
						// there is an error in reponse
						this.$emit('new-alert', get_alert_obj(1, msg_data_validation_failed))
					}else{
						// the event was added successfully
						this.$emit('update-event', event)

						// if success reset info in the addition form
						Object.assign(this.$data, this.initAddEvent())
					}

				}else{

					// prepare it for sending to server
					var res = api_add_event(Object.assign({}, event)) // need to use assign to eliminate data change from function
					
					if(res === false){
						// something else went wrong
						this.$emit('new-alert', get_alert_obj(2, msg_something_went_wrong_server))
					}else if(res == 416){
						// there is an error in reponse (validation)
						this.$emit('new-alert', get_alert_obj(1, msg_data_validation_failed))
					}else{
						// the event was added successfully
						// add the token back to the event object
						event.token = res
						this.$emit('new-event', event) // tell the app that a new-event is on the way
						// if success reset info in the addition form
						Object.assign(this.$data, this.initAddEvent())
					}
				}
			}
		},
		cancel_update: function(event){
			// when the user clicks cancel update
			// reset the form data
			Object.assign(this.$data, this.initAddEvent())
			this.$emit('cancel-update') // tell the app that the user has cancelled the event update
 		},
		initAddEvent: function(){

			// the default start time is the current user's time with 0 minutes and seconds.
			// so if the user's time is 6:15pm
			// then it will put 6:00pm as default value for start time
			var start_time = moment(this.chosen_day).hours(moment().hours()).minutes(0).seconds(0).millisecond(0)
			// the end_time is 30 minutes after the start time (chosen aribitarly)
			var end_time = moment(start_time).add(30, "minutes")

			// return the form data object
			return {
				errors: [],
				token: null, //used for updates
			    title: "No title",
				location: "No location",
				start_time: start_time,
				end_time: end_time,
				all_day: false,
				details: null // used for when updating is happening
			} 
		},
	},
	mounted() {
		// this part of the app is called when
		// all views are loaded and everything is visible to the user
		var _this = this

		// the default start time is the current user's time with 0 minutes and seconds.
		// so if the user's time is 6:15pm
		// then it will put 6:00pm as default value for start time
		var start_time = moment(this.chosen_day).hours(moment().hours()).minutes(0).seconds(0).millisecond(0)
		// the end_time is 30 minutes after the start time (chosen aribitarly)
		var end_time = moment(start_time).add(30, "minutes")
		
		// assign variable with new times
		this.start_time = start_time
		this.end_time = end_time


		// for the popup overly (for showing an event)
		$('#event_view').popup({
			type: 'overlay'
		});

		// start and end times plugin settings 
		var timePickerOptions = {
			disableTextInput: true,
			step: 15,
			closeOnWindowScroll: true,
			showDuration: true
		};

		$("#startTimePicker").timepicker(timePickerOptions).on("changeTime", function() {
			// when start time is changed, then update the min time for the end_time input
			$("#endTimePicker").timepicker('option', 'minTime', $("#startTimePicker").timepicker('getTime'))

			// updateh the form start time with new data
			_this.start_time = moment($("#startTimePicker").timepicker('getTime', moment(_this.chosen_day).hours(0).minutes(0).seconds(0).millisecond(0).millisecond(0).toDate()))
			
			// bubble the day when start is after end time
			if(_this.end_time.diff(_this.start_time) < 0){
				_this.end_time.add(1, 'days')
			}
		});

		$("#endTimePicker").timepicker(timePickerOptions).on("changeTime", function() {
			// if the user has chosen a start time
			if(_this.start_time){
				var end_time = moment($("#endTimePicker").timepicker('getTime', _this.start_time.toDate()))
				if(end_time.diff(_this.start_time) < 0){
					// if start is after end then bubble the day if
					end_time.add(1, 'days')
				}
				_this.end_time = end_time
			}
		});
	},
	watch: {
		// when any of the variables here change, then the callback functions will be called
		update_event: function(event){
			// when the update button is clicked
			// and the variable has changed
			if(this.update_event != null){
				// new event data is recieved
				// update the form inputs
				this.token = event.token
				this.title = event.title
				this.location = event.location
				this.start_time = moment(event.start_date)
				this.end_time = moment(event.end_date)
				this.details = event.description
			}
		},
		chosen_day: function(event){
			
			// this is used for calculating the end time compared to the start time
			var diff = this.end_time.date() - this.start_time.date()
			this.start_time = moment(this.chosen_day).hours(this.start_time.hours()).minutes(this.start_time.minutes())
			// if the end time chosen by the user is before the start time, then add one day in the end time
			if(diff > 0){
				this.end_time = moment(this.chosen_day).hours(this.end_time.hours()).minutes(this.end_time.minutes()).add(diff, 'days')
			}else{
				this.end_time = moment(this.chosen_day).hours(this.end_time.hours()).minutes(this.end_time.minutes())
			}			
		},
		start_time: function(event){
			// when start_time is changed (not by the user)
			// then update the time selction form no the new time
			if(this.start_time == null){
				// logically this should never happes
				// but used for accessing the variable
				$("#startTimePicker").timepicker('setTime', moment(this.chosen_day).hours(0).minutes(0).seconds(0).millisecond(0).toDate())
			}else{
				$("#startTimePicker").timepicker('setTime', this.start_time.toDate())
			}
		},
		end_time: function(event){
			// when end_time is changed (not by the user)
			// then update the time selction form no the new time
			if(this.end_time == null){
				// logically this should never happes
				// but used for accessing the variable
				$("#endTimePicker").timepicker('setTime', moment(this.chosen_day).hours(0).minutes(0).seconds(0).millisecond(0).toDate())
			}else{
				$("#endTimePicker").timepicker('setTime', this.end_time.toDate())
			}
		}
	}
})



/**
 * 
 * MAIN VUE JS APP VARIABLE
 *
 * considered the main engine behind the app, will be responsible for creating views for the user
 * and orchestrate how each componenet will communicate
 */

var app = new Vue({
	el: '#app',
	data: { // default data for variables
		events: all_events,
		slots: slot_status,
		day: current_day,
		days: get_week_data(current_day),
		pickday: null,
		view_event: false,
		alert: init_alert,
		update_event_details: null,
		time_print: moment().hour(0).minute(0)
	},
	methods: {
		show_alert: function(alert) {
			// when there is an alert to be shown to user
			// at the top part
			this.$set(this, 'alert', alert)
		},
		push_event: function(event) {
			// helper function used to push events to the array
			this.events.push(event)
		},
		execute_update_event: function(event) {
			// the provided event shall be already validated and
			// successfully sent to the server
			
			
			// first delete the old event
			for (var i = this.events.length - 1; i >= 0; i--) {
				if(this.events[i].token == event.token){
					this.events.splice(i, 1)
				}
			}

			// the push the new event to array
			this.push_event(event)
			// reset the update event variable
			this.$set(this, 'update_event_details', null)
		},
		prepare_event_view: function(event_id) {
			// when the user clicks a slot, then this function
			// will prepare the overely the section for the event view
			event = get_event(this.events, event_id);
			this.view_event = event
		},
		delete_event: function(event_id) {
			if(event_id){
				// first delete the event from server, then delete it locally	
				if(!api_delete_event(event_id)){
					// if api function returns false, then print a message to the user
					this.$emit('new-alert', get_alert_obj(2, msg_cant_delete_server))
				}else{
					// since the function != false, then it successeded
					for (var i = this.events.length - 1; i >= 0; i--) {
						// delete the event from array
						if(this.events[i].token == event_id){
							this.events.splice(i, 1)
						}
					}
				}
			}
		},
		show_update_event: function(event) {
			// change the event details in add-form
			// update the current day viewed to the event's start_date value
			this.$set(this, 'day', moment(this.view_event.start_date).hours(0).minutes(0).seconds(0).millisecond(0))
        	this.$set(this, 'days', get_week_data(this.day))
        	// assign the variable with the event's data
			this.update_event_details = this.view_event
		},
		delete_all_events: function(event) {
			// used when the user clicked the delete all events button
			if(confirm(msg_delete_all_confirm + this.events.length)){
				// send a dialog for the user, to make sure that they want to continue
				if(!api_delete_all_events()){
					// in case  the server fauiled to delete all events
					this.$emit('new-alert', get_alert_obj(2, msg_cant_delete_server))
				}else{
					// if success, then empty the events array
					this.events = []
				}

			}
		},
		get_conflicts: function(form_data) {
			// check for all conflicts and return array of condlicts
			var conflicts = []

			for (var i = this.events.length - 1; i >= 0; i--) {
				// first check if the event is similar to one we are adding (update)
				if(form_data.token !== null && form_data.token == this.events[i].token) continue

				// if start or end dates between the event dates added it to the array
				// basically there two cases, if the start_time is between the event in array's start and end time
				// then add it as conflict
				// or vice-versa, if the event in array start or end time is between the from's event start and end times
				// then add it as a conflict
				if((form_data.start_time.isSameOrAfter(this.events[i].start_date) && form_data.start_time.isSameOrBefore(this.events[i].end_date)) 
					|| (form_data.end_time.isSameOrAfter(this.events[i].start_date) && form_data.end_time.isSameOrBefore(this.events[i].end_date))
					|| (this.events[i].start_date.isSameOrAfter(form_data.start_time) && this.events[i].start_date.isSameOrBefore(form_data.end_time)) 
					|| (this.events[i].end_date.isSameOrAfter(form_data.start_time) && this.events[i].end_date.isSameOrBefore(form_data.end_time)))
				{
					conflicts.push(this.events[i].token) // add the event token
				}
			}

			return conflicts
		},
		print_time: function() {
			// resposible for initially printing the times in the table
			var ret = this.time_print.format("h:mma")
			// add 15 minutes every time the the function is requested
			this.time_print = this.time_print.add(15, 'minutes')
			return ret
		}

	},
	mounted () {
		// variable to access inner data from jQuery
		var _this = this

		// for the jump to date inline widget
		$("#date-view").datetimepicker({
            inline: true,
            format: "MM/DD/YYYY"
        });

        // what happens when the date is changed?
        // change the current day variable
        $("#date-view").on("dp.change", function(e){
        	_this.$set(_this, 'day', moment(e.date).hours(0).minutes(0).seconds(0).millisecond(0))
        	_this.$set(_this, 'days', get_week_data(_this.day))
        })

	},
	watch: {
		events: function(val) {
			// need new empty cells for the new slots 
			this.slots = map_events(this.events, get_empty_cells([7, 24, 4]), this.day)
		},
		day: function(val) {
			// what to do when the day variable changes

			// render the table again
			this.slots = map_events(this.events, get_empty_cells([7, 24, 4]), this.day)

			// if the time was set before, then just update the day
			$("#date-view").data("DateTimePicker").date(moment(this.day).hours(0).minutes(0).seconds(0).millisecond(0))
	}}
})



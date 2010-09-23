if(!jsBackend) { var jsBackend = new Object(); }

jsBackend = {
	// datamembers
	debug: {option:SPOON_DEBUG}true{/option:SPOON_DEBUG}{option:!SPOON_DEBUG}false{/option:!SPOON_DEBUG},
	current: { module: null, action: null, language: null },

	// init, something like a constructor
	init: function() {
		// get url and split into chunks
		var chunks = document.location.pathname.split('/');

		// set some properties
		jsBackend.current.module = chunks[3];
		jsBackend.current.action = chunks[4];
		jsBackend.current.language = chunks[2];

		// init stuff
		jsBackend.initAjax();
		jsBackend.balloons.init();
		jsBackend.controls.init();
		jsBackend.forms.init();
		jsBackend.layout.init();
		jsBackend.messages.init();
		jsBackend.tabs.init();
		jsBackend.tooltip.init();
		jsBackend.tableSequenceByDragAndDrop.init();
		jsBackend.tinyMCE.init();
		
		// IE fixes
		jsBackend.selectors.init();
		jsBackend.focusfix.init();
	},

	// init ajax
	initAjax: function() {
		// set defaults for AJAX
		$.ajaxSetup({ cache: false, type: 'POST', dataType: 'json', timeout: 10000 });

		// global error handler
		$(document).ajaxError(function(event, XMLHttpRequest, ajaxOptions) {

			// 403 means we aren't authenticated anymore, so reload the page
			if(XMLHttpRequest.status == 403) window.location.reload();

			// check if a custom errorhandler is used
			if(typeof ajaxOptions.error == 'undefined') {
				// init var
				var textStatus = '{$errSomethingWentWrong}';

				// get real message
				if(typeof XMLHttpRequest.responseText != 'undefined') textStatus = $.parseJSON(XMLHttpRequest.responseText).message;

				// show message
				jsBackend.messages.add('error', textStatus);
			}
		});

		// spinner stuff
		$(document).ajaxStart(function() { $('#ajaxSpinner').show(); });
		$(document).ajaxStop(function() { $('#ajaxSpinner').hide(); });
	},

	// end
	eof: true
}

jsBackend.balloons = {
	// init, something like a constructor
	init: function() {
		$('.balloon:visible').each(function() {
			// search linked element
			var linkedElement = $('*[rel='+ $(this).attr('id') +']');

			// linked item found?
			if(linkedElement != null)
			{
				// position
				$(this).css('position', 'absolute')
						.css('top', linkedElement.offset().top + linkedElement.height() + 10)
						.css('left', linkedElement.offset().left - 30);
			}
		});

		$('.toggleBalloon').click(jsBackend.balloons.click);
	},
	click: function(evt) {
		var clickedElement = $(this);

		// get linked balloon
		var rel = clickedElement.attr('rel');

		// rel available?
		if(rel != '') {
			// hide if already visible
			if($('#'+ rel).is(':visible')) {
				// hide
				$('#'+ rel).fadeOut(500);

				// unbind
				$(window).unbind('resize');
			}

			// not visible
			else
			{
				// position
				jsBackend.balloons.position(clickedElement, $('#'+ rel));

				// show
				$('#'+ rel).fadeIn(500);

				// set focus on first visible field
				if($('#'+ rel +' form input:visible:first').length > 0) $('#'+ rel +' form input:visible:first').focus();

				// bind resize
				$(window).resize(function() { jsBackend.balloons.position(clickedElement, $('#'+ rel)); });
			}
		}
	},
	position: function(clickedElement, element) {
		// position
		element.css('position', 'absolute')
				.css('top', clickedElement.offset().top + clickedElement.height() + 10)
				.css('left', clickedElement.offset().left - 30);
	},
	// end
	eof: true
}


jsBackend.controls = {
	// init, something like a constructor
	init: function() {
		jsBackend.controls.bindCheckboxTextfieldCombo();
		jsBackend.controls.bindConfirm();
		jsBackend.controls.bindFakeDropdown();
		jsBackend.controls.bindFullWidthSwitch();
		jsBackend.controls.bindMassAction();
		jsBackend.controls.bindMassCheckbox();
		jsBackend.controls.bindPasswordStrengthMeter();
		jsBackend.controls.bindWorkingLanguageSelection();
		jsBackend.controls.bindTableCheckbox();
		jsBackend.controls.bindTargetBlank();
		jsBackend.controls.bindToggleDiv();
	},
	// bind a checkbox textfield combo
	bindCheckboxTextfieldCombo: function() {
		$('.checkboxTextFieldCombo').each(function() {
			// check if needed element exists
			if($(this).find('input:checkbox').length > 0 && $(this).find('input:text').length > 0) {
				var checkbox = $($(this).find('input:checkbox')[0]);
				var textField = $($(this).find('input:text')[0]);

				checkbox.bind('change', function(evt) {
					var combo = $(this).parents().filter('.checkboxTextFieldCombo');
					var field = $(combo.find('input:text')[0]);

					if($(this).is(':checked')) {
						field.removeClass('disabled').attr('disabled', '');
						field.focus();
					}
					else field.addClass('disabled').attr('disabled', 'disabled');
				});

				if(checkbox.is(':checked')) textField.removeClass('disabled').attr('disabled', '');
				else textField.addClass('disabled').attr('disabled', 'disabled');
			}
		});
	},
	// bind confirm message
	bindConfirm: function() {
		// initialize
		$('.askConfirmation').each(function() {
			// get id
			var id = $(this).attr('rel');
			var url = $(this).attr('href');

			if(id != '' && url != '')
			{
				// initialize
				$('#'+ id).dialog({ autoOpen: false, draggable: false, resizable: false, modal: true,
									buttons: { '{$lblOK|ucfirst}': function() {
																		// close
																		// dialog
																		$(this).dialog('close');

																		// goto
																		// link
																		window.location = url;
																	},
												'{$lblCancel|ucfirst}': function() { $(this).dialog('close'); }
											 },
									open: function(evt) {
												 // set focus on first button
												 if($(this).next().find('button').length > 0) { $(this).next().find('button')[0].focus(); }
											 }
								 });
			}
		});

		// bind clicks
		$('.askConfirmation').live('click', function(evt) {
			// prevent default
			evt.preventDefault();

			// get id
			var id = $(this).attr('rel');

			// bind
			if(id != '') $('#'+ id).dialog('open');
		});
	},

	bindFakeDropdown: function() {
		$('.fakeDropdown').bind('click', function(evt) {
			// prevent default behaviour
			evt.preventDefault();

			// stop it
			evt.stopPropagation();

			// get id
			var id = $(this).attr('href');

			if($(id).is(':visible')) {
				// remove events
				$('body').unbind('click');
				$('body').unbind('keyup');

				// remove class
				$(this).parent().removeClass('selected');

				// hide
				$(id).hide('blind', {}, 'fast');
			} else {
				// bind escape
				$('body').bind('keyup', function(evt) {
					if(evt.keyCode == 27) {
						// unbind event
						$('body').unbind('keyup');

						// remove class
						$(this).parent().removeClass('selected');

						// hide
						$(id).hide('blind', {}, 'fast');
					}
				});

				// bind click outside
				$('body').bind('click', function(evt) {
					// unbind event
					$('body').unbind('click');

					// remove class
					$(this).parent().removeClass('selected');

					// hide
					$(id).hide('blind', {}, 'fast');
				});

				// add class
				$(this).parent().addClass('selected');

				// show
				$(id).show('blind', {}, 'fast');
			}
		})
	},

	// toggle between full width and sidebar-layout
	bindFullWidthSwitch: function() {
		$('#fullwidthSwitch a').toggle(
				function(evt) {
					// prevent default behaviour
					evt.preventDefault();

					// add class
					$(this).parent().addClass('collapsed');

					// toggle
					$('#subnavigation, #pagesTree').fadeOut(250);

				}, function(evt) {
					// Stuff to do every *even* time the element is clicked;
					evt.preventDefault();

					// remove class
					$(this).parent().removeClass('collapsed');

					// toggle
					$('#subnavigation, #pagesTree').fadeIn(500);
				});
	},

	// bind confirm message
	bindMassAction: function() {
		// set disabled
		$('.tableOptions .massAction select').addClass('disabled').attr('disabled', 'disabled');
		$('.tableOptions .massAction .submitButton').addClass('disabledButton').attr('disabled', 'disabled');

		// hook change events
		$('table input:checkbox').change(function(evt) {
			// get parent table
			var table = $($(this).parents('table.datagrid'));

			// any item checked?
			if(table.find('input:checkbox:checked').length > 0) {
				table.find('.massAction select').removeClass('disabled').attr('disabled', '');
				table.find('.massAction .submitButton').removeClass('disabledButton').attr('disabled', '');
			}
			else {
				table.find('.massAction select').addClass('disabled').attr('disabled', 'disabled');
				table.find('.massAction .submitButton').addClass('disabledButton').attr('disabled', 'disabled');
			}
		});

		// initialize
		$('.tableOptions .massAction option').each(function() {
			// get id
			var id = $(this).attr('rel');

			// initialize
			$('#'+ id).dialog({ autoOpen: false, draggable: false, resizable: false, modal: true,
								buttons: { '{$lblOK|ucfirst}': function() {
																	// close
																	// dialog
																	$(this).dialog('close');

																	// submit
																	// the form
																	$($('*[rel='+ $(this).attr('id') +']').parents('form')).submit();
																},
											'{$lblCancel|ucfirst}': function() { $(this).dialog('close'); }
										 },
								open: function(evt) {
											 // set focus on first button
											 if($(this).next().find('button').length > 0) { $(this).next().find('button')[0].focus(); }
										 }
							 });

		});

		// hijack the form
		$('.tableOptions .massAction .submitButton').live('click', function(evt) {
			// get the selected element
			if($(this).parents('.massAction').find('select[name=action] option:selected').length > 0) {
				// prevent default action
				evt.preventDefault();

				var element = $(this).parents('.massAction').find('select[name=action] option:selected');

				// if the rel-attribute exists we should show the dialog
				if(typeof element.attr('rel') != 'undefined') {
					// get id
					var id = element.attr('rel');

					// open dialog
					$('#'+ id).dialog('open');
				}

				// no confirm
				else $($(this).parents('form')).submit();
			}

			// no confirm
			else $($(this).parents('form')).submit();
		});
	},

	// check all checkboxes with one checkbox in the tableheader
	bindMassCheckbox: function() {
		$('th .checkboxHolder input:checkbox').bind('change', function(evt) {
			// check or uncheck all the checkboxes in this datagrid
			$($(this).closest('table').find('td input:checkbox')).attr('checked', $(this).is(':checked'));
			// set selected class
			if($(this).is(':checked')) $($(this).parents().filter('table')[0]).find('tbody tr').addClass('selected');
			else $($(this).parents().filter('table')[0]).find('tbody tr').removeClass('selected');
		});
	},
	bindPasswordStrengthMeter: function() {
		if($('.passwordStrength').length > 0) {
			$('.passwordStrength').each(function() {
				// grab id
				var id = $(this).attr('rel');
				var wrapperId = $(this).attr('id');

				// hide all
				$('#'+ wrapperId +' p.strength').hide();

				// excecute function directly
				var classToShow = jsBackend.controls.checkPassword($('#'+ id).val());

				// show
				$('#'+ wrapperId +' p.'+ classToShow).show();

				// bind keypress
				$('#'+ id).bind('keyup', function() {
					// hide all
					$('#'+ wrapperId +' p.strength').hide();

					// excecute function directly
					var classToShow = jsBackend.controls.checkPassword($('#'+ id).val());

					// show
					$('#'+ wrapperId +' p.'+ classToShow).show();
				});
			});
		}
	},
	// check a string for passwordstrength
	checkPassword: function(string) {

		// init vars
		var score = 0;
		var uniqueChars = [];

		// less then 4 chars isn't a valid password
		if(string.length <= 4) return 'none';

		// loop chars and add unique chars
		for(var i = 0; i<string.length; i++) {
			if($.inArray(string.charAt(i), uniqueChars) == -1) { uniqueChars.push(string.charAt(i)); }
		}

		// less then 3 unique chars is just week
		if(uniqueChars.length < 3) return 'weak';

		// more then 6 chars is good
		if(string.length >= 6) score++;

		// more then 8 is beter
		if(string.length >= 8) score++;

		// upper and lowercase?
		if((string.match(/[a-z]/)) && string.match(/[A-Z]/)) score += 2;

		// number?
		if(string.match(/\d+/)) score++;

		// special char?
		if(string.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) score++;

		// strong password
		if(score >= 4) return 'strong';

		// ok
		if(score >= 2) return 'ok';

		// fallback
		return 'weak';
	},
	// toggle a div
	bindToggleDiv: function() {
		$('.toggleDiv').live('click', function(evt) {
			// prevent default
			evt.preventDefault();

			// get id
			var id = $(this).attr('href');

			// show/hide
			$(id).toggle();

			// set selected class on parent
			if($(id).is(':visible')) $(this).parent().addClass('selected');
			else $(this).parent().removeClass('selected');
		});
	},
	// bind checkboxes in a row
	bindTableCheckbox: function() {
		// set classes
		$('tr td input:checkbox:checked').each(function() { $($(this).parents().filter('tr')[0]).addClass('selected'); });

		// bind change-events
		$('tr td input:checkbox').live('change', function(evt) {
			if($(this).is(':checked')) $($(this).parents().filter('tr')[0]).addClass('selected');
			else $($(this).parents().filter('tr')[0]).removeClass('selected');
		});
	},
	
	// bind target blank
	bindTargetBlank: function() {
		$('a.targetBlank').attr('target', '_blank');
	},

	// togle between the working languages
	bindWorkingLanguageSelection: function() {
		$('#workingLanguage').bind('change', function(evt) {
			// preventDefault
			evt.preventDefault();

			// break the url int parts
			var urlChunks = document.location.pathname.split('/');

			// get the querystring, we will append it later
			var queryChunks = document.location.search.split('&');
			var newChunks = [];

			// any parts in the querystring
			if(typeof queryChunks != 'undefined' && queryChunks.length > 0) {
				// remove variables that could trigger an message
				for(var i in queryChunks) {
					if(queryChunks[i].substring(0, 5) != 'token' &&
						queryChunks[i].substring(0, 5) != 'error' &&
						queryChunks[i].substring(0, 6) == 'report' &&
						queryChunks[i].substring(0, 3) == 'var' &&
						queryChunks[i].substring(0, 9) == 'highlight')
					{
						newChunks.push(queryChunks[i]);
					}
				}
			}

			// replace the third element with the new language
			urlChunks[2] = $(this).val();

			// remove action
			urlChunks.pop();
			
			var url = urlChunks.join('/');
			if(newChunks.length > 0) url += '?token=true&' + newChunks.join('&');

			// rebuild the url and redirect
			document.location.href = url;
		});
	},

	// end
	eof: true
}

jsBackend.effects = {
	// init, something like a constructor
	init: function() {
		jsBackend.effects.bindFadeOutAfterMouseMove();
		jsBackend.effects.bindHighlight();
	},

	// when the mouse is moved, all items with a class "fadeOutAfterMouseMove"
	// will fade away
	bindFadeOutAfterMouseMove: function() {
		$(document.body).bind('mousemove', function(evt) { $('.fadeOutAfterMouseMove').fadeOut(2500); });
	},

	// if a var highlightId exists it will be highlighted
	bindHighlight: function() {
		if(typeof highlightId != 'undefined') {
			var selector = highlightId;
			// if the element is a table-row we should highlight all cells in
			// that row
			if($(highlightId)[0].tagName.toLowerCase == 'tr') { selector += ' td'; }
			$(selector).effect('highlight', null, 5000);
		}
	},

	// end
	eof: true
}

jsBackend.forms = {
	// init, something like a constructor
	init: function() {
		jsBackend.forms.focusFirstField();
		jsBackend.forms.datefields();
		jsBackend.forms.submitWithLinks();
		jsBackend.forms.tagBoxes();
	},

	//
	datefields: function() {
		// the default, nothing special
		if($('.inputDatefieldNormal').length > 0) {
			$('.inputDatefieldNormal').each(function() {
				var data = $(this).attr('rel').split(':::');
				$(this).datepicker({
									dateFormat: data[0],
									dayNames: ['{$locDayLongMon}', '{$locDayLongTue}', '{$locDayLongWed}', '{$locDayLongThu}', '{$locDayLongFri}', '{$locDayLongSat}', '{$locDayLongSat}'],
									dayNamesMin: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									dayNamesShort: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									firstDay: data[1],
									hideIfNoPrevNext: true,
									monthNames: ['{$locMonthLong1}', '{$locMonthLong2}', '{$locMonthLong3}', '{$locMonthLong4}', '{$locMonthLong5}', '{$locMonthLong6}', '{$locMonthLong7}', '{$locMonthLong8}', '{$locMonthLong9}', '{$locMonthLong10}', '{$locMonthLong11}', '{$locMonthLong12}'],
									monthNamesShort: ['{$locMonthShort1}', '{$locMonthShort2}', '{$locMonthShort3}', '{$locMonthShort4}', '{$locMonthShort5}', '{$locMonthShort6}', '{$locMonthShort7}', '{$locMonthShort8}', '{$locMonthShort9}', '{$locMonthShort10}', '{$locMonthShort11}', '{$locMonthShort12}'],
									nextText: '{$lblNext}',
									prevText: '{$lblPrevious}',
									showAnim: 'slideDown'
								});
			});
		}

		// datefields that have a certain startdate
		if($('.inputDatefieldFrom').length > 0) {
			$('.inputDatefieldFrom').each(function() {
				var data = $(this).attr('rel').split(':::');
				$(this).datepicker({
									dateFormat: data[0],
									dayNames: ['{$locDayLongMon}', '{$locDayLongTue}', '{$locDayLongWed}', '{$locDayLongThu}', '{$locDayLongFri}', '{$locDayLongSat}', '{$locDayLongSat}'],
									dayNamesMin: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									dayNamesShort: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									firstDay: data[1],
									hideIfNoPrevNext: true,
									monthNames: ['{$locMonthLong1}', '{$locMonthLong2}', '{$locMonthLong3}', '{$locMonthLong4}', '{$locMonthLong5}', '{$locMonthLong6}', '{$locMonthLong7}', '{$locMonthLong8}', '{$locMonthLong9}', '{$locMonthLong10}', '{$locMonthLong11}', '{$locMonthLong12}'],
									monthNamesShort: ['{$locMonthShort1}', '{$locMonthShort2}', '{$locMonthShort3}', '{$locMonthShort4}', '{$locMonthShort5}', '{$locMonthShort6}', '{$locMonthShort7}', '{$locMonthShort8}', '{$locMonthShort9}', '{$locMonthShort10}', '{$locMonthShort11}', '{$locMonthShort12}'],
									nextText: '{$lblNext}',
									prevText: '{$lblPrevious}',
									minDate: new Date(parseInt(data[2].split('-')[0], 10), parseInt(data[2].split('-')[1], 10) - 1, parseInt(data[2].split('-')[2], 10)),
									showAnim: 'slideDown'
								});
			});
		}

		// datefields that have a certain enddate
		if($('.inputDatefieldTill').length > 0) {
			$('.inputDatefieldTill').each(function() {
				var data = $(this).attr('rel').split(':::');
				$(this).datepicker({
									dateFormat: data[0],
									dayNames: ['{$locDayLongMon}', '{$locDayLongTue}', '{$locDayLongWed}', '{$locDayLongThu}', '{$locDayLongFri}', '{$locDayLongSat}', '{$locDayLongSat}'],
									dayNamesMin: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									dayNamesShort: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									firstDay: data[1],
									hideIfNoPrevNext: true,
									monthNames: ['{$locMonthLong1}', '{$locMonthLong2}', '{$locMonthLong3}', '{$locMonthLong4}', '{$locMonthLong5}', '{$locMonthLong6}', '{$locMonthLong7}', '{$locMonthLong8}', '{$locMonthLong9}', '{$locMonthLong10}', '{$locMonthLong11}', '{$locMonthLong12}'],
									monthNamesShort: ['{$locMonthShort1}', '{$locMonthShort2}', '{$locMonthShort3}', '{$locMonthShort4}', '{$locMonthShort5}', '{$locMonthShort6}', '{$locMonthShort7}', '{$locMonthShort8}', '{$locMonthShort9}', '{$locMonthShort10}', '{$locMonthShort11}', '{$locMonthShort12}'],
									nextText: '{$lblNext}',
									prevText: '{$lblPrevious}',
									maxDate: new Date(parseInt(data[2].split('-')[0], 10), parseInt(data[2].split('-')[1], 10) -1, parseInt(data[2].split('-')[2], 10)),
									showAnim: 'slideDown'
								});
			});
		}

		// datefields that have a certain range
		if($('.inputDatefieldRange').length > 0) {
			$('.inputDatefieldRange').each(function() {
				var data = $(this).attr('rel').split(':::');
				$(this).datepicker({
									dateFormat: data[0],
									dayNames: ['{$locDayLongMon}', '{$locDayLongTue}', '{$locDayLongWed}', '{$locDayLongThu}', '{$locDayLongFri}', '{$locDayLongSat}', '{$locDayLongSat}'],
									dayNamesMin: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									dayNamesShort: ['{$locDayShortMon}', '{$locDayShortTue}', '{$locDayShortWed}', '{$locDayShortThu}', '{$locDayShortFri}', '{$locDayShortSat}', '{$locDayShortSat}'],
									firstDay: data[1],
									hideIfNoPrevNext: true,
									monthNames: ['{$locMonthLong1}', '{$locMonthLong2}', '{$locMonthLong3}', '{$locMonthLong4}', '{$locMonthLong5}', '{$locMonthLong6}', '{$locMonthLong7}', '{$locMonthLong8}', '{$locMonthLong9}', '{$locMonthLong10}', '{$locMonthLong11}', '{$locMonthLong12}'],
									monthNamesShort: ['{$locMonthShort1}', '{$locMonthShort2}', '{$locMonthShort3}', '{$locMonthShort4}', '{$locMonthShort5}', '{$locMonthShort6}', '{$locMonthShort7}', '{$locMonthShort8}', '{$locMonthShort9}', '{$locMonthShort10}', '{$locMonthShort11}', '{$locMonthShort12}'],
									nextText: '{$lblNext}',
									prevText: '{$lblPrevious}',
									minDate: new Date(parseInt(data[2].split('-')[0], 10), parseInt(data[2].split('-')[1], 10) - 1, parseInt(data[2].split('-')[2], 10), 0, 0, 0, 0),
									maxDate: new Date(parseInt(data[3].split('-')[0], 10), parseInt(data[3].split('-')[1], 10) - 1, parseInt(data[3].split('-')[2], 10), 23, 59, 59),
									showAnim: 'slideDown'
								});
			});
		}
	},

	// set the focus on the first field
	focusFirstField: function() {
		$('form input:visible:not(.noFocus):first').focus();
	},

	submitWithLinks: function() {
		// the html for the button that will replace the input[submit]
		var replaceHTML = '<a class="{class}" href="#"><span>{label}</span></a>';

		// are there any forms that should be submitted with a link?
		if($('form.submitWithLink').length > 0) {
			$('form.submitWithLink').each(function() {
				// get id
				var formId = $(this).attr('id');
				var dontSubmit = false;

				// validate id
				if(formId != '') {
					// loop every button to be replaced
					$('form#'+ formId + '.submitWithLink input:submit').each(function() {
						$(this).after(replaceHTML.replace('{label}', $(this).val()).replace('{class}', 'submitButton button ' + $(this).attr('class')))
								.css({position:'absolute', top:'-9000px', left: '-9000px'})
								.attr('tabindex', -1);
					});

					// add onclick event for button (button can't have the name
					// submit)
					$('form#'+ formId + ' a.submitButton').bind('click', function(evt) {
						evt.preventDefault();

						// is the button disabled?
						if($(this).attr('disabled') == 'disabled') return false;

						//
						else $('form#'+ formId).submit();
					});

					// dont submit the form on certain elements
					$('form#'+ formId + ' .dontSubmit').bind('focus', function() { dontSubmit = true; })
					$('form#'+ formId + ' .dontSubmit').bind('blur', function() { dontSubmit = false; })

					// hijack the submit event
					$('form#'+ formId).submit(function(evt) { return !dontSubmit; });
				}
			});
		}
	},

	tagBoxes: function() {
		if($('#sidebar input.tagBox').length > 0) { $('#sidebar input.tagBox').tagBox({ emptyMessage: '{$msgNoTags|addslashes}', addLabel: '{$lblAdd|ucfirst}', removeLabel: '{$lblDeleteThisTag|ucfirst}', autoCompleteUrl: '/backend/ajax.php?module=tags&action=autocomplete&language={$LANGUAGE}' }); }
		if($('#leftColumn input.tagBox, #tabTags input.tagBox').length > 0) { $('#leftColumn input.tagBox, #tabTags input.tagBox').tagBox({ emptyMessage: '{$msgNoTags|addslashes}', addLabel: '{$lblAdd|ucfirst}', removeLabel: '{$lblDeleteThisTag|ucfirst}', autoCompleteUrl: '/backend/ajax.php?module=tags&action=autocomplete&language={$LANGUAGE}', showIconOnly: false }); }
	},

	// end
	eof: true
}

jsBackend.layout = {
	// init, something like a constructor
	init: function() {
		// hovers
		$('.contentTitle').hover(function() { $(this).addClass('hover'); }, function() { $(this).removeClass('hover'); });
		$('.datagrid td a').hover(function() { $(this).parent().addClass('hover'); }, function() { $(this).parent().removeClass('hover'); });

		jsBackend.layout.showBrowserWarning();
		jsBackend.layout.datagrid();
		if($('.datafilter').length > 0) jsBackend.layout.dataFilter();

		// fix last childs
		$('.options p:last').addClass('lastChild');
		if($('.dataFilter').length > 0) jsBackend.layout.dataFilter();
	},
	// dataFilter layout fixes
	dataFilter: function() {
		// add last child and first child for IE
		$('.dataFilter tbody td:first-child').addClass('firstChild');
		$('.dataFilter tbody td:last-child').addClass('lastChild');

		// init var
		var tallest = 0;

		// loop group
		$('.dataFilter tbody .options').each(function() {
			// taller?
			if($(this).height() > tallest) tallest = $(this).height();
		});

		// set new height
		$('.dataFilter tbody .options').height(tallest);
	},
	// datagrid layout
	datagrid: function() {
		if(jQuery.browser.msie) {
			$('.datagrid tr td:last-child').addClass('lastChild');
			$('.datagrid tr td:first-child').addClass('firstChild');
		}

		// dynamic striping
		$('.dynamicStriping.datagrid tr:nth-child(2n)').addClass('even');
		$('.dynamicStriping.datagrid tr:nth-child(2n+1)').addClass('odd');
	},
	// if the browser isn't supported show a warning
	showBrowserWarning: function() {
		var showWarning = false;

		// check firefox
		if(jQuery.browser.mozilla) {
			// get version
			var version = parseInt(jQuery.browser.version.substr(0,3).replace(/\./g, ''));

			// lower then 3?
			if(version < 19) { showWarning = true; }
		}

		// check opera
		if(jQuery.browser.opera) {
			// get version
			var version = parseInt(jQuery.browser.version.substr(0,1));

			// lower then 9?
			if(version < 9) { showWarning = true; }
		}

		// check safari, should be webkit when using 1.4
		if(jQuery.browser.safari) {
			// get version
			var version = parseInt(jQuery.browser.version.substr(0,3));

			// lower then 9?
			if(version < 400) { showWarning = true; }
		}

		// check IE
		if(jQuery.browser.msie) {
			// get version
			var version = parseInt(jQuery.browser.version.substr(0,1));

			// lower or equal then 6
			if(version <= 6) { showWarning = true; }
		}

		// show warning if needed
		if(showWarning) { $('#showBrowserWarning').show(); }
	},
	// end
	eof: true
}

jsBackend.messages = {
	timers: [],

	// init, something like a constructor
	init: function() {
		// bind close button
		$('#messaging .formMessage .iconClose').live('click', function(evt) {
			evt.preventDefault();
			jsBackend.messages.hide($($(this).parents('.formMessage')));
		});
	},
	// hide a message
	hide: function(element) {
		// fade out
		element.fadeOut();
	},
	// add a new message into the que
	add: function(type, content) {
		var uniqueId = 'e'+ new Date().getTime().toString();
		var html = '<div id="'+ uniqueId +'" class="formMessage '+ type +'Message" style="display: none;">'+
					'	<p>'+ content +'</p>'+
					'	<div class="buttonHolderRight">'+
					'		<a class="button icon linkButton iconClose iconOnly" href="#"><span>X</span></a>'+
					'	</div>'+
					'</div>';

		// prepend
		$('#messaging').prepend(html);

		// show
		$('#'+ uniqueId).fadeIn();

		// timeout
		if(type == 'notice') { setTimeout('jsBackend.messages.hide($("#'+ uniqueId +'"));', 5000); }
		if(type == 'success') { setTimeout('jsBackend.messages.hide($("#'+ uniqueId +'"));', 5000); }
	},
	// end
	eof: true
}

jsBackend.tabs = {
	// init, something like a constructor
	init: function() {
		if($('.tabs').length > 0) {
			$('.tabs').tabs();

			$('.tabs .ui-tabs-panel').each(function() {
				if($(this).find('.formError:visible').length > 0) {
					$($('.ui-tabs-nav a[href="#'+ $(this).attr('id') +'"]').parent()).addClass('ui-state-error');
				}
			});

		}

		if($('.tabSelect').length > 0) {
			$('.tabSelect').live('click', function(evt) {
				// prevent default
				evt.preventDefault();
				$('.tabs').tabs('select', $(this).attr('href'));
			});
		}
	},

	// end
	eof: true
}

jsBackend.tinyMCE = {
	// init, something like a constructor
	init: function() {
		$('.inputEditor').before('<div class="clickToEdit"><span>{$msgClickToEdit|addslashes}</span></div>');
		
		// bind click on the element
		$('.clickToEdit').live('click', function(evt) {
			// get id
			var id = $(this).siblings('textarea.inputEditor:first').attr('id');

			// validate id
			if(typeof id != undefined) {
				// show the toolbar
				$('#'+ id + '_external').show();

				// set focus to the editor
				tinyMCE.get(id).focus();
			}
		});
	},	
	checkContent: function(editor) {
		if(editor.isDirty()) {
			var content = editor.getContent();
			var warnings = [];

			// no alt?
			if(content.match(/<img(.*)alt=""(.*)/im)) { warnings.push('{$msgEditorImagesWithoutAlt|addslashes}'); }

			// invalid links?
			if(content.match(/href="\/private\/([a-z]{2,})\/([a-z_]*)\/(.*)"/im)) { warnings.push('{$msgEditorInvalidLinks|addslashes}'); }
			
			// any warnings?
			if(warnings.length > 0) {
				if($('#' + editor.id + '_warnings').length > 0) $('#' + editor.id + '_warnings').html(warnings.join(' '));
				else $('#' + editor.id + '_parent').after('<span id="'+ editor.id + '_warnings' +'" class="infoMessage editorWarning">'+ warnings.join(' ') + '</span>');
			}
			
			// no warnings
			else $('#' + editor.id + '_warnings').remove();
		}
	},
	
	// end
	eof: true
}

jsBackend.tooltip = {
	// init, something like a constructor
	init: function() {
		if($('.help').length > 0) {
			$('.help').tooltip({ effect: 'fade' })
						.dynamic();
		}
	},

	// end
	eof: true
}

jsBackend.selectors = {
	// init, something like a constructor
	init: function() {

		// Missing CSS selector support IE6, IE7

		// IE6 and IE7, IE8 as IE7
		if ($.browser.msie && $.browser.version.substr(0,1)<9) {
			// Nothing yet
		}

	},

	// end
	eof: true
}

jsBackend.focusfix = {
	// init, something like a constructor
	init: function() {

		function focusfix(selector, className) {
			$(selector).focus(function() {
				$(this).addClass(className);
			});
			// Removes class when focus is lost
			$(selector).blur(function() {
				$(this).removeClass(className);
			});
		}

		// IE6 & IE7 focus fix
		if ($.browser.msie && $.browser.version.substr(0,1)<9) {
			// Apply focusfix
			focusfix('input.inputText', 'focus');
			focusfix('textarea', 'focus');
		}

	},

	// end
	eof: true
}

jsBackend.tableSequenceByDragAndDrop = {
	// init, something like a constructor
	init: function() {
		if($('.sequenceByDragAndDrop tbody').length > 0) {
			$('.sequenceByDragAndDrop tbody').sortable({
				items: 'tr',
				handle: 'td.dragAndDropHandle',
				placeholder: 'dragAndDropPlaceholder',
				forcePlaceholderSize: true,
				stop: function(event, ui) {
					// the table
					var table = $(this);
					
					// buil ajax-url
					var url = '/backend/ajax.php?module=' + jsBackend.current.module + '&action=sequence&language=' + jsBackend.current.language;
					
					// init var
					var rows = $(this).find('tr');
					var newIdSequence = new Array();
					
					// loop rowIds
					rows.each(function() { newIdSequence.push($(this).attr('rel')); });

					// make the call
					$.ajax({cache: false, type: 'POST', dataType: 'json',
						url: url,
						data: 'new_id_sequence=' + newIdSequence.join(','),
						success: function(data, textStatus) {
							// not a succes so revert the changes
							if(data.code != 200) {
								// revert
								table.sortable('cancel');
								
								// show message
								jsBackend.messages.add('error', 'alter sequence failed.');
							}

							// success

							// redo odd-even
							table.find('tr').removeClass('odd').removeClass('even');
							table.find('tr:even').addClass('even');
							table.find('tr:odd').addClass('odd');
							
							// alert the user
							if(data.code != 200 && jsBackend.debug) { alert(data.message); }
						},
						error: function(XMLHttpRequest, textStatus, errorThrown) {
							// revert
							table.sortable('cancel');

							// show message
							jsBackend.messages.add('error', 'alter sequence failed.');

							// alert the user
							if(jsBackend.debug) alert(textStatus);
						}
					});
				}
			});
		}
	},

	// end
	eof: true
}

$(document).ready(function() { jsBackend.init(); });
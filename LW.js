(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.LW = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var LWdb = require('./LWdb');


function BoxOfQuestions(db) {


        // private variables

        var _question = null; // no current question
        var _wordsToRepeat = null; // words which are eligible to be repeated.
                                   // initialisation to null forces calculation 
                                   // on first call of wordsToRepeat()

        var _status = {};
        var _sessionExpiryTimeInSeconds = 1800;               





        // private methods

        var _questionHasBeenProcessed = function(){

               _question = null; 

               // This will trigger a new question, when LW.question()
               // is called the next time.
	       
        };












        var _updateSessionInfo = function(sessionExpiryTimeInSeconds){
               // update session info in the _status object

               // _status.sessionStartDateMS
               // _status.sessionLastActivityDateMS
               // _status.sessionIsNew


               var dateTimeNow = (new Date()).valueOf();  // milliseconds



              
               function createNewSession() {
                     _status.sessionStartDateMS = dateTimeNow;
                     _status.sessionLastActivityDateMS = _status.sessionStartDateMS;
                     _status.sessionStartDate = (new Date(dateTimeNow)).toJSON();
                     _status.sessionLastActivityDate = _status.sessionStartDate
                     _status.sessionIsNew = true;
               }





               function dateTimeDifferenceInSeconds(dateA, dateB) {
                      // calculate dateA - dateB
                      return (dateA - dateB)/ 1000
               };
 




               // if (sessionStartDateProperty does not exist)
               if (!_status.hasOwnProperty("sessionStartDate")) {
                     // app has just started up. Thus we have no session yet.
                     createNewSession();
                     return _status
               }
              

               // check if session is expired ; 1800 seconds; 
               var previousActivityDate = _status.sessionLastActivityDateMS;
               if (dateTimeDifferenceInSeconds(dateTimeNow,previousActivityDate) > sessionExpiryTimeInSeconds) {
                     createNewSession();
                     return _status
               };


               // we have an active session; just update sessionLastActivityDate
               _status.sessionLastActivityDateMS = (new Date()).valueOf();
               _status.sessionLastActivityDate = (new Date(_status.sessionLastActivityDateMS)).toJSON();
              return _status
        };












        var _getRandomInt = function(min, max){
             // Returns a random integer between min (inclusive) and max (inclusive)
             // Using Math.round() will give you a non-uniform distribution!
             
    		return Math.floor(Math.random() * (max - min + 1)) + min;
	};



        var _shuffle =function(a) {
			 var j, x, i;
		    for (i = a.length; i; i--) {
		        j = Math.floor(Math.random() * i);
		        x = a[i - 1];
		        a[i - 1] = a[j];
		        a[j] = x;
		    };
                    return a		   
	};








        // ===============================================================================
        // literal object
        // ===============================================================================


        return {
       
        version: '0.2.2',

	db : db,

	name : db.dbName,





	chooseRandomObject : function(anArray){
                return anArray[_getRandomInt(0,anArray.length-1)];
	},




        question : function(){
            // gives back a question to ask
            if (!_question) { 
                 // _question is null, go for a new one.
                 var wds = this.wordsToRepeat();
                 if (wds != null) {_question = this.chooseRandomObject(wds)}
            }; 
            return _question 
        },








        answer :function(){
            return (this.question()).translate;
        },






       moveQuestionBackwards : function(){
            if (_question) { // we have a question


                // set new date for asking the question again;
                // this has to be a a delay period later.

                _question.date = new Date().valueOf() + (this.db.getSettings()).delay;


                _question.step = 0; 
                     

                this.db.putWord(_question);

                // As the question has a new later date it is no more 
                // a current question

                _questionHasBeenProcessed();
            }
        },



       answerWasWrong : function(){this.moveQuestionBackwards()},


       moveQuestionForward : function(){
 
            if (_question) { // we have a question
                 var s = this.db.getSettings();

                // calculate new date. This depends on which step the question is.
                // And the delay calculation factor for that particular step.
                _question.date = new Date().valueOf() + 
                                 s.delay * s.factorForDelayValue[_question.step];

                // With repeated calls to this method 
                // the following will move the question up. 
                // 

                _question.step = _question.step + 1;

                // The assumption is that long delay values for higher steps 
                // prevent an access error for 
                //     s.factorForDelayValue[stepNumber]

                this.db.putWord(_question);
 
                // As the question has a new later date it is no more 
                // a current question

                _questionHasBeenProcessed();

               
            }  
       },



       answerWasCorrect : function(){this.moveQuestionForward()},



      importFrom : function(anArrayOfObjects){
       this.db.importFrom(anArrayOfObjects);
       },








       getAnswerOptions : function(numberOfOptions){
          // simple implementation : choose from all available words
          // As we use ECMA5script findIndex is not available.
          // We have to duplicate the effort in keeping an array of id
          // numbers called idsOfOptions and an array of objects called
          // options.

          var n = (db.getSettings()).numberOfOptions;
          
          var options = [];
        
          if (db.numberOfWords() >= n) {
             
             var q = this.question();
             options.push(q);

	     var idsOfOptions = [];
             idsOfOptions.push(q._id);
             
             var anOption;
             var allWords =  this.db.allWords();  
            
             do {
                // choose option from all words.
                anOption = this.chooseRandomObject(allWords);

                if (idsOfOptions.indexOf(anOption._id) == -1) {
                        // the new option is not included yet
			idsOfOptions.push(anOption._id);
                        options.push(anOption)
               }
           
             } while (options.length < n);


          };
          return _shuffle(options)
       },







       config : function(config){
          throw new Error("not yet implemented");
       },








       status : function(){
         // give the number of words in the whole box,
         // the number of words in the wordsToRepeat array and
         // information about the session which was updated by _updateSessionInfo()

         _status.numberOfWords = this.db.numberOfWords();

         if (_wordsToRepeat) {_status.noOfWordsToRepeat = _wordsToRepeat.length};
  
         return _status
       },








       addMoreWordsForLearning : function(n){
          console.log("addMoreWordsForLearning n=",n);
          // update n words with step value < 0 to have a step value of 0
          var candidatesToAdd = this.wordsWithStepValue(-10000,-1);
          
          // sort according to step value descending, e.g. -1,-2,-3 ...
          // sort is in place
          candidatesToAdd.sort(function(a,b) {return a.step < b.step});


          var numberOfWordsToAdd;
          // if not enough words are left to add only add what is available
          if (n < candidatesToAdd.length) { numberOfWordsToAdd = n}
          else {numberOfWordsToAdd = candidatesToAdd.length};


          // Update db with new step values

          for (var i = 0; i < numberOfWordsToAdd; i++){
             (candidatesToAdd[i]).step = 0;
             db.putWord(candidatesToAdd[i]);
             console.log(i, (candidatesToAdd[i]).word);  
          }

          console.log(_status);

       }, 









       wordsToRepeat : function(){

          // calculate the array with words which are to be learned/repeated during a sessio

          // all words with step value 0 and above are considered.
          var lowestStep = 0;  

          // words with a date value >= todayNow are considered
          var todayNow = new Date().valueOf(); 


          // the function with the condition for inclusion into the result array
          function isToBeRepeated(aWord) {         
               return (aWord.step >= lowestStep) && (todayNow >= aWord.date);
          }
          
          

          if (_question == null || _wordsToRepeat == null ) { 
                // _question == null means that either a question has never
                // been asked before or that a question has been asked and
                // processed but no new question yet has been picked.
                // In both cases a new _wordsToRepeat collection is necessary.

                _wordsToRepeat = (this.db.allWords()).filter(isToBeRepeated)

                _sessionExpiryTimeInSeconds = (this.db.getSettings()).sessionExpiryTimeInSeconds;
                _updateSessionInfo(_sessionExpiryTimeInSeconds);

                if (_status.sessionIsNew) {
                   // the opportunity to check if we have enough _wordsToRepeat
                   var suggestedNumberOfWordsInASession = (this.db.getSettings()).suggestedNumberOfWordsInASession;

                   if (_wordsToRepeat.length < suggestedNumberOfWordsInASession) {
                      // we need to 
                      this.addMoreWordsForLearning(suggestedNumberOfWordsInASession - _wordsToRepeat.length); 
                      // and recalulate
                      _wordsToRepeat = (this.db.allWords()).filter(isToBeRepeated)
                   };

                   _status.sessionIsNew = false;
                }

          };

          return _wordsToRepeat;
       },







       wordsWithStepValue : function(from, to){
          var toValue;

          if ( typeof(to) == "undefined" || to == null ) {toValue = from}
          else {toValue = to}

          function stepValueInRange(aWord) {         
               return (aWord.step >= from) && (aWord.step <= toValue);
          }
          

          return (this.db.allWords()).filter(stepValueInRange);
       }




      }




}



module.exports = BoxOfQuestions;

},{"./LWdb":2}],2:[function(require,module,exports){
(function (global){
"use strict";
// ----------------------------------------------------------------------
// LearnWords 2 
//
// File: 
//    LWdb.js
//
// Purpose: 
//    Database layer
//    Definition of an LWdb object
//
// Date:
//    28th December 2016
//
// ----------------------------------------------------------------------


if (typeof localStorage === "undefined" || localStorage === null) {
  // we run in node thus we need to have a simulation of LocalStorage
  var LocalStorage = require('node-localstorage').LocalStorage;
  global.localStorage = new LocalStorage('./scratch');
}




var LWdb = function(name) {

    // functional style, 
    // closure, returns an LWdb object

    var dbName = name;

    // private variables

    var _keysOfAllWords = [];

    var _numberOfWords = 0;

    
    var recalculateIndex = true; 

    var _defaultInitialStepValue = -1;




    // private methods


    var _wdKeyFor = function(anInteger) { 
        return dbName+'-wd-'+anInteger;
    };



    var _setNumberOfWords = function(n) {
        var key = dbName+'-numberOfWords';
        localStorage.setItem(key,n);
        _numberOfWords = n;
        recalculateIndex = true;
    };



    var _incNumberOfWords = function() {
        _setNumberOfWords(_numberOfWords + 1);
        recalculateIndex = true;
    };


    var _invalidateIndex = function() {
        recalculateIndex = true;
    };



    var _indexNeedsRecalculation = function() {
        return recalculateIndex
    };



    var _indexHasBeenUpdated = function() {
        recalculateIndex = false;
    };




    var _removeObjects = function(aKeyPrefix){
        if (!!localStorage) {   // this.isOK()
            var key;
            var st; 
            var keysToDelete = [];

            // find all keys starting with aKeyPrefix
            for (var i = 0; i < localStorage.length; i++){
                key = localStorage.key(i);
                st = localStorage.getItem(key);                             

                if (key.lastIndexOf(aKeyPrefix,0) === 0) {
                    keysToDelete.push(key);
                }
            }

            keysToDelete.forEach(function(aKey){
                localStorage.removeItem(aKey);
            });

        }
        };
    








    // construct literal LWdb object
    // methods and properties are public

    return {

    dbName : name,

    putSettings : function(anObject) {
        
        var key = dbName + '-settings';
        return localStorage.setItem(key,JSON.stringify(anObject));  
    },






    removeWords : function() {
        var keys = this.keysOfAllWords(); 
        for (var i = 0; i < keys.length; i++){
            localStorage.removeItem(keys[i]);
        }
        _setNumberOfWords(0);
        _invalidateIndex();
    },






    destroy : function() {

         var aKeyPrefix = dbName;  
         _removeObjects(aKeyPrefix);
    },



      persistentStorageOK : function() {
        return !!localStorage;
      },




      isOK : function() {
         return this.persistentStorageOK();
      },






    numberOfWords : function() {
     
       var key = dbName+'-numberOfWords';
        var r = 0;

        if (this.isOK()) {
            r = localStorage.getItem(key);
            if (r == null) {
                localStorage.setItem(key,'0'); 
                r = '0';
            };
          r = parseInt(r);
        }; 
        _numberOfWords = r;
        return r;
    },








    putWord : function(aWord) {

        if(!aWord._id){
            throw "_id is required in a word";
        }

        if(!aWord.hasOwnProperty("step")){
            aWord.step = _defaultInitialStepValue;
        }
        if(!aWord.date){
            aWord.date = 0;
        }

        // get storage key 
        var storageKey = _wdKeyFor(aWord._id);
        // try to get the word to check if it already exists
        var value = localStorage.getItem(storageKey); 
     
        // save the word

        localStorage.setItem(storageKey, JSON.stringify(aWord));

        // if the word has not existed before increment the number of words
        if (value == null) {
            _incNumberOfWords();
        };
        // console.log('storageKey is=', storageKey, 'word is=', copy.word);
        return storageKey;
    },







    getWord : function(anInteger) {
        var storageKey = _wdKeyFor(anInteger);
        try{
            var aWord = JSON.parse(localStorage.getItem(storageKey));
            if(!aWord.hasOwnProperty("step")){
                aWord.step = _defaultInitialStepValue;
            }
            if(!aWord.date){
                aWord.date = 0;
            }
            return aWord;
        }catch(e){
            return null;
        }
    },



    importFrom : function(theWords) {
      
      var key;
      var n = theWords.length;

      var aWord;
      
      for(var i = 0; i < n; i++){
        aWord = theWords[i];
	key = this.putWord(aWord);
      }

      _invalidateIndex();

    },




    loadWords : function(theWords) {
        this.importFrom(theWords);
    },







    keysOfAllWords : function() {
        if (_indexNeedsRecalculation()) {
            _keysOfAllWords = [];
            var keyRegex = new RegExp("^"+dbName+"\\-wd\\-\\d+$");
            for (var i = 0; i < localStorage.length; i++){
                var key = localStorage.key(i);
                // check it starts with <name>-wd-
                if(keyRegex.test(key)){
                    _keysOfAllWords.push(key);
                }
            };
            // _setNumberOfWords(_keysOfAllWords.length);
            // as putWord() updates n
            _indexHasBeenUpdated();
	    
        };
        return _keysOfAllWords;
    },





    allWords : function() {
        var keys = this.keysOfAllWords();
        var words = [];
        for(var i = 0; i < keys.length; i++){
            var str = localStorage.getItem(keys[i]);
            words.push(JSON.parse(str));
        }
        return words;
    },





    getSettings : function() {
        
        var key = dbName + '-settings';

        var value = localStorage.getItem(key);

        // lazy initialisation
        if (value==null) { 
            // define default value for settings    
            value = { "delay": 8640000, 
                      "numberOfOptions": 4,
                      "factorForDelayValue": [1,1,3,7,45,90,360,1000],
                      "defaultInitialStepValue" : _defaultInitialStepValue,
                      "sessionExpiryTimeInSeconds" : 1800,
                      "suggestedNumberOfWordsInASession" : 20
                      };
            // One day = 24h * 60m * 60s * 1000 ms = 86'400'000 ms (milliseconds)          
            // the delay has been shortened to 1 day/10 for test purposes.
            // this is 2h 24 min. 
            // the value is used to calculate the new date after a
            // word has been answered correctly.

            // "defaultInitialStepValue : -1 means that words means 
            // that words are available to be picked and sent to
            // learn/repeat mode.

            this.putSettings(value);
            return value
        } else {
            return JSON.parse(value)
        }
    }









    }  // end of literal LWdb object




}; // end of LWdb function definition


module.exports = LWdb;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"node-localstorage":undefined}],3:[function(require,module,exports){
"use strict"; 

// Public LearnWords functions and properties that will be accessible in the
// LW namespace. 
module.exports = {
	BoxOfQuestions: require('./BoxOfQuestions'),
	LWdb: require('./LWdb')
};
},{"./BoxOfQuestions":1,"./LWdb":2}]},{},[3])(3)
});
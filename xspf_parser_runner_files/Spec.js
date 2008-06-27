/*
Script: Spec.js
	Main file for the BDD plug-in.

License:
	MIT-style license.
*/

var Mock = {};

Mock.Set = function(example) {
  this.example = example;
  this.mocks = {};
  this.messages = [];
  this.length = 0;
};

Mock.Set.prototype = {
  create: function(name) {
    this.length++;
    this.mocks[name] = new Mock.Instance(this);
    return this.mocks[name];
  },
  verify: function() {
		for (var mock in this.mocks) {
      if (!this.mocks[mock]._verify()) {
        this.messages.push(this.mocks[mock].message)
      }
		}
		return this.messages;
  }
};

Mock.Instance = function(set) {
  this.set = set;
  this.expected = {};
  this.actual = {};
};

Mock.Instance.prototype = {
  expects: function(obj) {
    this.set.example.assertions++;
    for (var method in obj) {
      this.expected[method] = obj[method];
      this[method] = function() {
        this.actual[method] = arguments;
      }.bind(this);
    }
  },
  stubs: function(obj) {
    for (var method in obj) {
      this[method] = function() {
        return obj[method];
      };
    }
  },
  _verify: function() {
    for (var method in this.expected) {
      var actarg = this.actual[method];
      var exp = this.expected[method];
      if (!actarg) {
        this.message = 'Expected '+method+'() but was not called';
        return false;
      }
      var act = [];
      for (var i = 0, l = actarg.length; i < l; i++) {
        act.push(actarg[i]);
  		}
  		var ok = true;
  		for (var i = 0, l = act.length; i < l; i++) {
        if (act[i] != exp[i]) ok = false;
  		}
      if (!ok) {
        this.message = 'Expected '+method+'() with '+exp+' but received '+act;
        if (console) console.log(act);
        return false;
      }
    }
    return true;
  }
};


var Spec = {};
var Specs = {};

Spec.Output = {

	group: function(name){
		return console.group(name);
	},

	groupEnd: function(name){
		return console.groupEnd(name);
	},

	info: function(data){
		return console.info(data);
	},

	error: function(data){
		console.error(data);
		return false;
	},

	success: function(data){
		console.info(data);
		return true;
	},

	log: function(data){
		return console.log(data);
	},

	warn: function(data){
		return console.warn(data);
	}

};

Spec.Describe = function(suite, context, examples, options) {
  if (Specs[suite] == undefined) {
    Specs[suite] = new Spec.Suite(suite);
  }
  Specs[suite].add_context(new Spec.Context(context, examples, options));
};

Spec.start = function(suite, callback){
  var success = Specs[suite].run();
  if (callback != undefined) {
    callback(success);
  }
};

Spec.Suite = function(name, options) {
	options = options || {};
  this.name = name;
  this.options = {
		onStart: function(){
			Spec.Output.group('Suite: ' + this.name);
		},
		onComplete: function(time){
			if (this.success) Spec.Output.success(this.name+' succeeded. Time taken: ' + time + ' ms');
			else Spec.Output.error(this.name+' failed. Time taken: ' + time + ' ms');
			Spec.Output.groupEnd('Suite: ' + this.name);
		}
	};

	for (var option in options) this.options[option] = options[option];

	this.name = name;

	this.contexts = [];
	
};


Spec.Suite.prototype = {
	run: function(){
	  this.success = true;
		this.options.onStart.call(this);

		this.startTime = new Date().getTime();

		for (var i = 0, l = this.contexts.length - 1; i < l; i++) {
      this.contexts[i].next = this.contexts[i+1];
		}
		
	  this.contexts[0].run();

		return this.success;
	},
	end: function() {
		var endTime = new Date().getTime();
		this.options.onComplete.call(this, endTime - this.startTime);
	},
	add_context: function(context) {
    var self = this;
	  context.suite = self;
	  this.contexts.push(context);
	}
};


Spec.Context = function(name, examples, options){

	options = options || {};

	this.errors = 0;

	this.options = {

		onStart: function(){
			Spec.Output.group('Context: ' + this.name);
		},

		onComplete: function(time){
			if (!this.errors) Spec.Output.success('Succeeded. Time taken: ' + time + ' ms');
			else Spec.Output.error('Context: ' +this.name+' failed: There were ' + this.errors + ' errors.');
			Spec.Output.groupEnd('Context: ' + this.name);
		}

	};

	for (var option in options) this.options[option] = options[option];

	this.name = name;

	this.examples = [];

  var setup = examples['setup'];
  var teardown = examples['teardown'];
  examples['setup'] = null;
  examples['teardown'] = null;

  var self = this;

	for (var example in examples){
	  if (examples[example] != undefined) {
  		var current = new Spec.Example(example, examples[example], setup, teardown, self);
  		var oldComplete = current.options.onComplete;
  		current.options.onComplete = function(time){
  			oldComplete.call(this, time);
  		};
  		this.examples.push(current);	    
	  }
	}

};

Spec.Context.prototype = {
	run: function(){
		this.options.onStart.call(this);

		this.startTime = new Date().getTime();

		for (var i = 0, l = this.examples.length - 1; i < l; i++) {
      this.examples[i].next = this.examples[i+1];
		}
		
	  this.examples[0].run();

	},
	end: function() {
		var endTime = new Date().getTime();
		this.options.onComplete.call(this, endTime - this.startTime);
    // return (this.errors == 0);
    if (this.errors > 0) {
      this.suite.success = false;
    }
    if (this.next) {
      this.next.run();      
    } else {
      this.suite.end();
    }
	}
};

Spec.Example = function(name, example, setup, teardown, context, options){
	options = options || {};

	this.options = {

		onStart: function(){
			Spec.Output.group(this.name);
		},

		onComplete: function(time){
			if (this.failed) {
			  Spec.Output.error('Failed: '+this.name);
			  this.context.errors++;
		  } else if (this.assertions > 0) {
		    var assertion_message = this.assertions+' assertion';
		    if (this.assertions != 1) assertion_message += 's';
		    Spec.Output.success('Example succeeded. '+assertion_message+'. Time taken: ' + time + ' ms');
		  } else if (/^setup/.test(this.name)) {
		    Spec.Output.info('Running setup method: "'+this.name+'" once.')
		  } else {
		    Spec.Output.warn('Example has no assertions! Time taken: ' + time + ' ms');
		  }
			Spec.Output.groupEnd(this.name);
		},

		onException: function(e){
		  var message = 'Exception occurred: ' + e;
		  if (console && console.trace) console.trace();
		  if (e.lineNumber && e.stack && e.fileName) {
        message += '\nFile: '+e.fileName+' line '+e.lineNumber + '\nStacktrace:\n'+e.stack;
      }
			Spec.Output.error(message);
			this.failed = true;
		}

	};

	for (var option in options) this.options[option] = options[option];

	this.example = example;
	this.setup = setup;
	this.teardown = teardown;
	this.context = context;
	this.name = name;
	this.async = false;
  var self = this;
  this.assert = new Spec.Assertions(Assert, this);
  this.mockSet = new Mock.Set(this);
  this.mock = function() {
    return this.mockSet.create(arguments);    
  };
  this.assertions = 0;
  this.message = function(message) {
    Spec.Output.info(message);
  };
  this.wait = function(func, time) {
    this.async = true;
    setTimeout(function() {
      try {
        func();
        self.end();
      } catch(e) {
        self.failed = true;
        self.options.onException.call(this, e);
        self.end();
      }
    },time);
  };
}

Spec.Example.prototype = {

	run: function(){

		this.options.onStart.call(this);
		this.startTime = new Date().getTime();

		try {
      if (this.setup) this.setup.call(this);
			this.example.call(this);
      if (!this.async) {
        this.end();
      } else {
        Spec.Output.warn('Example is asyncronous, waiting for callback.');		    
      }
      
		} catch(e){
		  this.failed = true;
			this.options.onException.call(this, e);
			this.end();
		}

	},

  end : function() {
    if (this.teardown) this.teardown.call(this);
    this.verify_mocks();
    var endTime = new Date().getTime();
		this.options.onComplete.call(this, endTime - this.startTime);
    if (this.next) {
      this.next.run();      
    } else {
      this.context.end();
    }
  },

  assertion_passed : function() {
    this.assertions++;
  },
  assertion_failed : function() {
    this.failed = true;
  },
  verify_mocks: function() {
    var messages = this.mockSet.verify();
    if (messages.length > 0) {
      this.failed = true;
      Spec.Output.error(messages.join('\n')); 
    }
  }

};

var Assert = {

	type: function(type, a){
		var aType = $type(a);
		return (aType != type) ? Spec.Output.error('Expecting type of "' + a + '" to be "' + type + '" but was "' + aType + '" instead.') : true;
	},

	equals: function(a, b){
		return (a !== b) ? Spec.Output.error('Expecting "' + a + '" but found "' + b + '".') : true;
	},

	isTrue: function(a){
		return (a !== true) ? Spec.Output.error('Object "' + a + '" is not true.') : true;
	},

	isFalse: function(a){
		return (a !== false) ? Spec.Output.error('Object "' + a + '" is not false.') : true;
	},

	isNull: function(a){
		return (a !== null) ? Spec.Output.error('Object "' + a + '" is not null.') : true;
	},

	isDefined: function(a){
		return (a == undefined) ? Spec.Output.error('Object "' + a + '" is not defined.') : true;
	},

	stringEquals: function(a, b){
		a = String(a);
		b = String(b);
		return (a != b) ? Spec.Output.error('String representation "' + a + '" is different than String representation "' + b + '".') : true;
	},

	enumEquals: function(a, b) {
		var isEqual = (a.length == b.length);
		for (var i = 0, j = a.length; i < j; i++) {
			if (a[i] != b[i]) isEqual = false;
		}
		return (!isEqual) ? Spec.Output.error('Enumerable ["' + a + '"] is different than Enumerable ["' + b + '"].') : true;
	}

};

Spec.Assertions = function(assertions, example) {
  for (var assertion in assertions) {
    this.addAssertion(assertion,assertions[assertion]);
  };
  this.example = example;
};

Spec.Assertions.prototype = {
  addAssertion: function(name, assertion) {
    this[name] = function() {
      if (assertion.apply(this.example, arguments)) {
        this.example.assertion_passed(name);
      } else {
        this.example.assertion_failed(name);
      }      
    };
  }
};
define(["Tone/core/Tone", "Tone/component/LFO", "Tone/component/Filter", "Tone/effect/StereoEffect"], 
function(Tone){

	"use strict";

	/**
	 *  @class A Phaser effect. inspiration from https://github.com/Dinahmoe/tuna/
	 *
	 *	@extends {Tone.StereoEffect}
	 *	@constructor
	 *	@param {number|Object} [rate=0.5] the speed of the phasing
	 *	@param {number} [depth=10] the depth of the effect
	 *	@param {number} [baseFrequency=400] the base frequency of the filters
	 */
	Tone.Phaser = function(){

		//set the defaults
		var options = this.optionsObject(arguments, ["rate", "depth", "baseFrequency"], Tone.Phaser.defaults);
		Tone.StereoEffect.call(this, options);

		/**
		 *  the lfo which controls the frequency on the left side
		 *  @type {Tone.LFO}
		 *  @private
		 */
		this._lfoL = new Tone.LFO(options.rate, 0, 1);

		/**
		 *  the lfo which controls the frequency on the right side
		 *  @type {Tone.LFO}
		 *  @private
		 */
		this._lfoR = new Tone.LFO(options.rate, 0, 1);
		this._lfoR.setPhase(180);

		/**
		 *  the base modulation frequency
		 *  @type {number}
		 *  @private
		 */
		this._baseFrequency = options.baseFrequency;

		/**
		 *  the depth of the phasing
		 *  @type {number}
		 *  @private
		 */
		this._depth = options.depth;
		
		/**
		 *  the array of filters for the left side
		 *  @type {Array.<Tone.Filter>}
		 *  @private
		 */
		this._filtersL = this._makeFilters(options.stages, this._lfoL, options.Q);

		/**
		 *  the array of filters for the left side
		 *  @type {Array.<Tone.Filter>}
		 *  @private
		 */
		this._filtersR = this._makeFilters(options.stages, this._lfoR, options.Q);
		
		//connect them up
		this.effectSendL.connect(this._filtersL[0]);
		this.effectSendR.connect(this._filtersR[0]);
		this._filtersL[options.stages - 1].connect(this.effectReturnL);
		this._filtersR[options.stages - 1].connect(this.effectReturnR);
		this.effectSendL.connect(this.effectReturnL);
		this.effectSendR.connect(this.effectReturnR);
		//control the frequency with one LFO
		this._lfoL.frequency.connect(this._lfoR.frequency);
		//set the options
		this.setBaseFrequency(options.baseFrequency);
		this.setDepth(options.depth);
		this.setRate(options.rate);
		//start the lfo
		this._lfoL.start();
		this._lfoR.start();
	};

	Tone.extend(Tone.Phaser, Tone.StereoEffect);

	/**
	 *  defaults
	 *  @static
	 *  @type {object}
	 */
	Tone.Phaser.defaults = {
		"rate" : 0.5,
		"depth" : 10,
		"stages" : 4,
		"Q" : 100,
		"baseFrequency" : 400,
	};

	/**
	 *  @param {number} stages
	 *  @returns {Array} the number of filters all connected together
	 *  @private
	 */
	Tone.Phaser.prototype._makeFilters = function(stages, connectToFreq, Q){
		var filters = new Array(stages);
		//make all the filters
		for (var i = 0; i < stages; i++){
			var filter = this.context.createBiquadFilter();
			filter.type = "allpass";
			filter.Q.value = Q;
			connectToFreq.connect(filter.frequency);
			filters[i] = filter;
		}
		this.connectSeries.apply(this, filters);
		return filters;
	};

	/**
	 *  set the depth of the chorus
	 *  @param {number} depth
	 */
	Tone.Phaser.prototype.setDepth = function(depth){
		this._depth = depth;
		var max = this._baseFrequency + this._baseFrequency * depth;
		this._lfoL.setMax(max);
		this._lfoR.setMax(max);
	};

	/**
	 *  set the base frequency of the filters
	 *  @param {number} freq
	 */
	Tone.Phaser.prototype.setBaseFrequency = function(freq){
		this._baseFrequency = freq;	
		this._lfoL.setMin(freq);
		this._lfoR.setMin(freq);
		this.setDepth(this._depth);
	};

	/**
	 *  set the phaser rate
	 *  @param {number} rate in hertz
	 */
	Tone.Phaser.prototype.setRate = function(rate){
		this._lfoL.setFrequency(rate);
	};

	/**
	 *  bulk setter
	 *  @param {object} params
	 */
	Tone.Phaser.prototype.set = function(params){
		if (!this.isUndef(params.rate)) this.setRate(params.rate);
		if (!this.isUndef(params.baseFrequency)) this.setBaseFrequency(params.baseFrequency);
		if (!this.isUndef(params.depth)) this.setDepth(params.depth);
		Tone.StereoEffect.prototype.set.call(this, params);
	};

	/**
	 *  clean up
	 */
	Tone.Phaser.prototype.dispose = function(){
		Tone.StereoEffect.prototype.dispose.call(this);
		this._lfoL.dispose();
		this._lfoL = null;
		this._lfoR.dispose();
		this._lfoR = null;
		for (var i = 0; i < this._filtersL.length; i++){
			this._filtersL[i].disconnect();
			this._filtersL[i] = null;
		}
		this._filtersL = null;
		for (var j = 0; j < this._filtersR.length; j++){
			this._filtersR[j].disconnect();
			this._filtersR[j] = null;
		}
		this._filtersR = null;
	};

	return Tone.Phaser;
});
var GlobalFixture = {};
var GF = GlobalFixture;
Spec.Describe('XSPFParser', 'parsing JSPF from XSPF xml dom',{
  'setup once' : function() {
    this.async = true;
    var self = this;
    var xhr = new XHR({'method':'get',isSuccess: function() {return true;}});
    xhr.addEvent('onSuccess',function(doctext) {
      var xspfdom = XSPF.XMLfromString(doctext);
      GF.xspfdom1 = xspfdom;
      self.end();
    });
    xhr.send('example.xspf');  
  },
  'should parse the jspf': function() {
    GF.jspf1 = XSPF.toJSPF(GF.xspfdom1);
    this.assert.equals('object',typeof GF.jspf1);
  },
  'should read the simple playlist elements' : function() {
    var pl = GF.jspf1.playlist;
    this.assert.equals('My playlist', pl.title);    
    this.assert.equals('Jane Doe', pl.creator);    
    this.assert.equals('My favorite songs', pl.annotation);    
    this.assert.equals('http://example.com/myplaylists', pl.info);
    this.assert.equals('http://example.com/myplaylists/myplaylist', pl.location);
    this.assert.equals('magnet:?xt=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C', pl.identifier);
    this.assert.equals('http://example.com/img/mypicture', pl.image);
    this.assert.equals('2005-01-08T17:10:47-05:00', pl.date);
    this.assert.equals('http://creativecommons.org/licenses/by/1.0/', pl.license);
  },
  'should read the attributions': function() {
    var pl = GF.jspf1.playlist;
    this.assert.type('array',pl.attribution);
    this.assert.equals('http://bar.com/secondderived.xspf',pl.attribution[0].identifier);
    this.assert.equals('http://foo.com/original.xspf',pl.attribution[1].location);
    this.assert.equals(2,pl.attribution.length);
  },
  'should read the links': function() {
    var pl = GF.jspf1.playlist;
    this.assert.type('array',pl.link);
    this.assert.equals('http://socialnetwork.example.org/foaf/mary.rdfs', pl.link[0]['http://foaf.example.org/namespace/version1']);
  },
  'should read the meta tags': function() {
    var pl = GF.jspf1.playlist;
    this.assert.type('array',pl.meta);
    this.assert.equals('\nvalue', pl.meta[0]['http://example.org/key']);
  },
  'should read extensions': function() {
    var pl = GF.jspf1.playlist;
    this.assert.type('object',pl.extension);
    this.assert.type('array',pl.extension['http://example.com']);
    this.assert.type('object',pl.extension['http://example.com'][0]);
    this.assert.equals('value',pl.extension['http://example.com'][0]['key']);
  },
  'should read the tracks simple values': function() {
    var pl = GF.jspf1.playlist;
    this.assert.type('array',pl.track);
    var t = pl.track[0];
    this.assert.equals('My Way',t.title);
    this.assert.equals('Frank Sinatra',t.creator);
    this.assert.equals('This is my theme song.\n        I love newlines.',t.annotation);
    this.assert.equals('http://franksinatra.com/myway',t.info);
    this.assert.equals('http://franksinatra.com/img/myway',t.image);
    this.assert.equals('Frank Sinatra\'s Greatest Hits',t.album);
    this.assert.equals(3,t.trackNum);
    this.assert.equals(19200,t.duration);
  },
  'should read the tracks locations': function() {
    var t = GF.jspf1.playlist.track[0];
    this.assert.type('array',t.location);
    this.assert.equals('http://example.com/my.mp3',t.location[0]);
    this.assert.equals('http://example.com/my.ogg',t.location[1]);
    this.assert.equals('http://example.com/whitespace.ogg',t.location[2]);
  },
  'should read the tracks identifiers': function() {
    var t = GF.jspf1.playlist.track[0];
    this.assert.type('array',t.identifier);
    this.assert.equals('magnet:?xt=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C',t.identifier[0]);
    this.assert.equals('http://franksinatra.com/myway.xml',t.identifier[1]);
  },
  'should read the track links': function() {
    var t = GF.jspf1.playlist.track[0];
    this.assert.type('array',t.link);
    this.assert.equals('http://socialnetwork.org/foaf/mary.rdfs', t.link[0]['http://foaf.org/namespace/version1']);
  },
  'should read the track meta': function() {
    var t = GF.jspf1.playlist.track[0];
    this.assert.type('array',t.meta);
    this.assert.equals('value', t.meta[0]['http://example.org/key']);
  },
  'should read track extensions': function() {
    var t = GF.jspf1.playlist.track[0];
    this.assert.type('object',t.extension);
    this.assert.type('array',t.extension['http://track.example.com']);
    this.assert.type('object',t.extension['http://track.example.com'][0]);
    this.assert.equals('\n          value2\n          ',t.extension['http://track.example.com'][0]['key2']);
  }
});
  

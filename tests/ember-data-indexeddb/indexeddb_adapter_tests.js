describe("DB.IndexedDBAdapter", function() {
  var dbName = 'DB.IndexedDBAdapter.test',
      indexedDB = window.indexedDB       ||
                  window.webkitIndexedDB ||
                  window.mozIndexedDB    ||
                  window.msIndexedDB;  

  beforeEach(function() {
    var App = Ember.Application.create();

    App.Person = DS.Model.extend({
      firstName: DS.attr('string'),
      lastName:  DS.attr('string'),

      fullName:  function() {
        return this.get('firstName') + ' ' + this.get('lastName');
      }.property('firstName', 'lastName'),

      birthday: DS.attr('date')
    });

    App.store = DS.IndexedDBStore.create({
      dbName: dbName,
      models: [App.Person]
    });

    this.App = App;
    window.App = App;//DEBUG
  });

  afterEach(function() {
    indexedDB.deleteDatabase(dbName);
  });

  //TODO: better async handling
  describe("configuration", function() {
    it("dummy test", function() { expect(true).toEqual(true); });

    xit("it sets the app db", function() {
      waits(10);

      runs(function() {
        expect(!!this.App.store.get('db')).toEqual(true);
      });
    });
  });
});

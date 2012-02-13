(function() {
  var get = Ember.get,
      set = Ember.set,
      getPath = Ember.getPath;

  var indexedDB = window.indexedDB       ||
                  window.webkitIndexedDB ||
                  window.mozIndexedDB    ||
                  window.msIndexedDB;  

  //TODO: fact-check
  var IDBTransaction = window.IDBTransaction       ||
                       window.webkitIDBTransaction ||
                       window.mozIDBTransaction    ||
                       window.msIDBTransaction;  

  var IDBKeyRange = window.IDBKeyRange       ||
                    window.webkitIDBKeyRange ||
                    window.mozIDBKeyRange    ||
                    window.msIDBKeyRange;  

  DS.IndexedDBStore = DS.Store.extend({
    init: function() {
      this.set('adapter', DS.IndexedDBAdapter.create());
      this.adapter.configure({
        dbName: this.dbName,
        models: this.models
      });

      this._super();
    },

    db: function() {
      return this.get('adapter.db');
    }.property('adapter')
  });

  DS.IndexedDBAdapter = DS.Adapter.extend({
    configure: function(options) {
      var adapter = this,
          request = indexedDB.open(options.dbName);

      request.onsuccess = function(evt) {
        var db = evt.target.result;
        adapter.set('db', db);
        adapter.migrateModels(db, options.models);
      };
      request.onerror = options.error;
    },

    migrateModels: function(db, models) {
      models.forEach(function(type) {
        var storename = this.getStoreName(type);
        db.createObjectStore(storename, {keyPath: 'id'});
        //TODO: create indices on all attributes
        console.log("TODO: would migrate " + model.toString());
      });
    },

    find: function(store, type, id) {
      var storename = this.getStoreName(type),
          request   = store.get('db').
                            transaction([storeName], IDBTransaction.READ_ONLY).
                            objectStore(storeName).
                            get(id);

      request.onsuccess = function(evt) {
        // Some contention as to the arity of this callback
        store.load(type, id, evt.target.result);
      };
      //What about not found?
    },

    /*
    findMany: function(store, type, ids) {
    },
    */

    // Query should be like {attrname: value}
    //TODO: partial matches
    findQuery: function(store, type, query, modelArray) {
      var storename   = this.getStoreName(type),
          objectStore = store.get('db').
                              transaction([storename], IDBTransaction.READ_ONLY).
                              objectStore(storeName),
          queryAttrs  = Object.keys(query);

      if (queryAttrs.length == 1) {
        var attr          = queryAttrs[0],
            index         = objectStore.index(attr),
            keyRange      = IDBKeyRange.only(queryAttrs[attr]),
            cursorRequest = index.openCursor(keyRange),
            matching      = [];

        cursorRequest.onSuccess = function(evt) {
          matching.push(evt.target.result);

          // I don't know if this is the correct way to tell if this is the
          // last record.
          if (cursorRequest.readyState == 2) modelArray.load(matching);
        };
      } else {
        //TODO: iterate over all records :/
      }
    },

    findAll: function(store, type) {
      var storename = this.getStoreName(type),
          request   = store.get('db').
                            transaction([storename], IDBTransaction.READ_ONLY).
                            objectStore(storeName).
                            openCursor(),
          records   = [];

      request.onsuccess = function(evt) {
        matching.push(evt.target.result);

        // I don't know if this is the correct way to tell if this is the
        // last record.
        if (cursorRequest.readyState == 2) modelArray.loadMany(type, records);
      };
    },

    createRecord: function(store, type, model) {
      var storeName = this.getStoreName(type),
          request = store.get('db').
                          transaction([storeName], IDBTransaction.READ_WRITE).
                          objectStore(storeName).
                          add(/*TODO: serialized record*/);
        
      request.onsuccess = function(evt) {
        //TODO: event.target.result is the new key
        //store.didCreateRecord()
      }
    },

    /*
    createRecords: function(store, type, modelArray) { 
    },
    */

    updateRecord: function(store, type, model) {
    },

    /*
    updateRecords: function(store, type, modelArray) {
    },
    */

    deleteRecord: function(store, type, model) {
      var storename  = this.getStoreName(type),
          primaryKey = this.getPKey(type),
          request    = store.get('db').
                             transaction([storeName], IDBTransaction.READ_WRITE).
                             objectStore(storeName).
                             delete(this.getId(type, model));

      request.onsuccess = function() {
        store.didDeleteRecord(model);
      }
    },

    /*
    deleteRecords: function(store, type, modelArray) {
    },
    */

    commit: function(store, commitDetails) {
    },

    //Helpers

    getStoreName: function(type) {
      // use the last part of the name as the URL
      var parts = type.toString().split(".");
      var name = parts[parts.length - 1];
      return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
    },

    getPKey: function(type) {
      return getPath(type, 'proto.primaryKey');
    },

    getId: function(type, model) {
      return get(model, this.getPKey(type));
    }
  });
}).call(this);

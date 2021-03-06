/*!
 * Array 补丁 与 增强
 * https://github.com/wusfen/pro.js
 * 2016.04.01 c
 * 2017.08.29 u
 */
(function() {
    function orExtend(obj, obj2) {
        for (var i in obj2) {
            obj[i] || (obj[i] = obj2[i]);
        }
        return obj;
    }

    // extend Array.prototype
    var selectOne;
    var aprox = {
        // 循环
        forEach: function(fn, thisArg) {
            for (var i = 0; i < this.length; i++) {
                fn.call(thisArg, this[i], i, this);
            }
            return this;
        },
        map: function(fn, thisArg) {
            var self = this;
            var rs = [];
            this.each(function(item) {
                rs.push(fn.apply(thisArg || self, arguments));
            });
            return rs;
        },
        // 返回列表中所有对象的键
        // keys, values 已存在，迭代器相关，与这里不一样
        ks: function() {
            var keys = [];
            this.each(function(obj) {
                for (var key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;
                    keys.ensure(key);
                }
            })
            return keys;
        },
        // 返回列表每个对象的某字段值
        vs: function(key) {
            return this.map(function(item) {
                return item[key]
            })
        },
        // 分页
        limit: function(start, count) {
            return this.slice(start, start + count);
        },
        page: function(pageIndex, pageSize) {
            pageSize = pageSize || this.pageSize();
            pageIndex = pageIndex < 1 ? 1 : pageIndex || this.pageIndex();
            this._pageIndex = pageIndex;
            var start = Math.min((pageIndex - 1) * pageSize, this.length);
            var end = Math.min(start + pageSize, this.length);

            var rs = [];
            for (var i = start; i < end; i++) {
                rs.push(this[i])
            }
            return rs;
        },
        pageIndex: function(index) {
            if (index) {
                var count = this.pageCount();
                index = Math.min(index, count);
                index = Math.max(1, index);
                this._pageIndex = index;
                return this
            }
            return this._pageIndex || 1
        },
        pageSize: function(n) {
            if (n) {
                this._pageSize = n;
                return this
            }
            return this._pageSize || window.pageSize || 10
        },
        pageCount: function(n) {
            return Math.ceil(this.length / (n || this.pageSize()))
        },
        count: function() {
            return this.length
        },
        // 查
        // select(id) // => select({id:id})
        // select({key:value, key2:value2})
        // select('key===value && key2<value2')
        // select(function(item){ return Boolean })
        select: function(where) {
            var findArr = [];
            for (var i = 0; i < this.length; i++) {
                var obj = this[i];
                var eq = false;

                if (!isNaN(+where)) { // Number
                    where = { id: where };
                }

                if (obj === where) {
                    eq = true;
                } else if (typeof where == 'string') {
                    with(obj) {
                        eq = eval(where);
                    }
                } else if (typeof where == 'function') {
                    if (where(obj, i, this)) {
                        eq = true;
                    }
                } else if (obj !== null && where !== null) {
                    eq = true;
                    for (var key in where) {
                        if (obj[key] != where[key]) { // ==
                            eq = false;
                            break;
                        }
                    }
                }

                if (eq) {
                    findArr.push(obj);
                    if (selectOne) break;
                }
            }
            return findArr;
        },
        // select one
        get: function(where) {
            selectOne = 1;
            var obj = this.select(where)[0];
            selectOne = 0;
            return obj;
        },
        first: function() {
            return this[0]
        },
        last: function() {
            return this[this.length - 1]
        },
        indexOf: function(obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        },
        // 判断是否存在，如果指定主键，只根据主键判断
        contains: function(item, pk) {
            if (typeof item == 'object') {
                var where = {};
                where[pk] = item[pk];
                return this.get(pk ? where : item);
            } else {
                return this.indexOf(item) != -1
            }
        },
        // 改
        update: function(kvs, where) {
            this.select(where).each(function(item) {
                for (var key in kvs) {
                    if (item.hasOwnProperty(key)) {
                        item[key] = kvs[key]
                    }
                }
            });
            return this;
        },
        set: function(fiels) {
            for (var i = 0; i < this.length; i++) {
                var obj = this[i];
                for (var key in fiels) {
                    obj[key] = fiels[key];
                }
            }
            return this;
        },
        save: function(obj, pk) {
            pk = pk || 'id';
            if (pk in Object(obj)) {
                var kv = {};
                kv[pk] = obj[pk];
                var findObj = this.get(kv);
                if (findObj) {
                    for (var key in obj) {
                        findObj[key] = obj[key];
                    }
                    return this;
                }
            }

            this.push(obj);
            return this;
        },
        // 删
        // 根据条件删除
        'delete': function(where) {
            if (typeof where == 'object') {
                var findArr = this.select(where);
                for (var i = 0; i < findArr.length; i++) {
                    for (var j = 0; j < this.length; j++) {
                        if (findArr[i] == this[j]) {
                            this.splice(j--, 1);
                        }
                    }
                }
            } else {
                this.remove(where)
            }
            return this;
        },
        // 移除所有这个对象
        remove: function(item) {
            for (var i = 0; i < this.length; i++) {
                if (item === this[i]) {
                    this.splice(i--, 1);
                }
            }
            return this;
        },
        removeIndex: function(i) {
            return this.splice(i, 1), this;
        },
        // 去重
        uniq: function(pk) {
            var length = this.length;
            for (var i = 0; i < length; i++) {
                for (var j = i + 1; j < length; j++) {
                    var eq = pk ?
                        this[i][pk] == this[j][pk] :
                        this[i] === this[j];
                    if (eq) {
                        this.splice(j--, 1), length--
                    }
                }
            }
            return this
        },
        // 增
        // 唯一增
        ensure: function(item, pk) {
            !this.contains(item, pk) && this.push(item);
            return this;
        },
        /**
         * 排序
         * @param  {[type]} field [description]
         * @param  {[type]} desc  [description]
         * @return {[type]}       [description]
         */
        order: function(field, desc) {
            // number 'number' 'string' obj
            return this.sort(function(a, b) {
                a = field ? a[field] : a;
                b = field ? b[field] : b;
                return desc ?
                    (a < b ? 1 : (a == b ? 0 : -1)) :
                    (a > b ? 1 : (a == b ? 0 : -1))
            });
        },
        /**
         * [
         *     {name:'n1', value:1},
         *     {name:'n1', value:2},
         *     {name:'n2', value:3},
         *     {name:'n2', value:4},
         * ].groupMap('name')
         * 
         * //=>
         * {
         *     n1: [
         *         {name:'n1', value:1},
         *         {name:'n1', value:2},
         *     ],
         *     n2: [
         *         {name:'n2', value:3},
         *         {name:'n2', value:4},
         *     ]
         * }
         * 
         * @param  {[type]} field [description]
         * @return {[type]}       [description]
         */
        groupMap: function(field) {
            var map = {};
            for (var i = 0; i < this.length; i++) {
                var item = this[i];
                var value = item[field];
                var arr = map[value] || (map[value] = []);
                arr.push(item);
            }
            return map;
        },
        /**
         * [
         *     {name:'n1', value:1},
         *     {name:'n1', value:2},
         *     {name:'n2', value:3},
         *     {name:'n2', value:4},
         * ].group('name')
         * 
         * //=>
         * [
         *     {name:'n1', data:[
         *         {name:'n1', value:1},
         *         {name:'n1', value:2},
         *     ]},
         *     {name:'n2', data:[
         *         {name:'n2', value:3},
         *         {name:'n2', value:4},
         *     ]},
         * ]
         * @param  {[type]} field [description]
         * @return {[type]}       [description]
         */
        group: function(field) {
            var groups = [];
            var map = this.groupMap(field);
            for (var key in map) {
                var group = {};
                group[field] = key;
                group.data = map[key];
                groups.push(group);
            }
            return groups;
        },
        /**
         * [1,2,3].without(2) //=> [1,3]
         * [1,2,3].without([1,3]) //=> [2]
         * [{id:1},{id:2},{id:3}].without([{id:2}]) //=> [{id:1},{id:3}]
         * @param  {*|Array} others - item or list
         * @return {Array}        new array
         */
        without: function(others) {
            others = others.push ? others : [others];
            var arr = this.concat();
            for (var i = 0; i < others.length; i++) {
                var item = others[i];
                arr.delete(item);
            }
            return arr
        },
        /**
         * random sort
         * @return {Array} this
         */
        shuffle: function() {
            return this.sort(function(a, b) {
                return Math.random() - .5
            })
        },
        toArray: function() {
            return this
        },
        max: function(field) {
            return Math.max.apply(Math, field ? this.col(field) : this)
        },
        min: function(field) {
            return Math.min.apply(Math, field ? this.col(field) : this)
        },
        /**
         * new array
         * @return {Array} 
         */
        copy: function() {
            return this.concat()
        },
        json: function() {
            // JSON.stringify 会先调用对象的 toJSON
            // toJSON(){stringify(this)} 会死循环
            return JSON.stringify(this)
        }
    };

    aprox.filter = aprox.select;
    aprox.where = aprox.select;
    aprox.each = aprox.forEach;
    aprox.has = aprox.contains;
    aprox.one = aprox.get;
    aprox.del = aprox['delete'];
    aprox.orderBy = aprox.order;
    aprox.groupBy = aprox.group;
    aprox.fields = aprox.ks;
    aprox.col = aprox.vs;

    orExtend(Array.prototype, aprox);

}());

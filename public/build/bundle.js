
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next, lookup.has(block.key));
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const showSolution = writable(false);
    const showHints = writable(false);

    /* src\NumericCell.svelte generated by Svelte v3.20.1 */
    const file = "src\\NumericCell.svelte";

    function create_fragment(ctx) {
    	let div;
    	let input;
    	let input_readonly_value;
    	let input_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			input.readOnly = input_readonly_value = /*item*/ ctx[0].task;
    			attr_dev(input, "type", "text");
    			attr_dev(input, "maxlength", "1");
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*inputClass*/ ctx[3]) + " svelte-pdqxo0"));
    			add_location(input, file, 85, 2, 1857);
    			attr_dev(div, "class", "svelte-pdqxo0");
    			toggle_class(div, "underline", /*item*/ ctx[0].underline);
    			toggle_class(div, "helpDiv", /*item*/ ctx[0].helpInput);
    			add_location(div, file, 84, 0, 1784);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			/*input_binding*/ ctx[12](input);
    			set_input_value(input, /*displayValue*/ ctx[2]);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[13]),
    				listen_dev(input, "keydown", /*callCallback*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && input_readonly_value !== (input_readonly_value = /*item*/ ctx[0].task)) {
    				prop_dev(input, "readOnly", input_readonly_value);
    			}

    			if (dirty & /*inputClass*/ 8 && input_class_value !== (input_class_value = "" + (null_to_empty(/*inputClass*/ ctx[3]) + " svelte-pdqxo0"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*displayValue*/ 4 && input.value !== /*displayValue*/ ctx[2]) {
    				set_input_value(input, /*displayValue*/ ctx[2]);
    			}

    			if (dirty & /*item*/ 1) {
    				toggle_class(div, "underline", /*item*/ ctx[0].underline);
    			}

    			if (dirty & /*item*/ 1) {
    				toggle_class(div, "helpDiv", /*item*/ ctx[0].helpInput);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[12](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let showSolution_value;

    	const unsubscribe = showSolution.subscribe(value => {
    		$$invalidate(7, showSolution_value = value);
    	});

    	let showHints_value;

    	const unsubscribe1 = showHints.subscribe(value => {
    		$$invalidate(8, showHints_value = value);
    	});

    	let { item } = $$props;
    	let { row } = $$props;
    	let { ref = null } = $$props;
    	let { callback } = $$props;

    	const callCallback = event => {
    		if (item.task) {
    			return;
    		}

    		if (event.keyCode >= 48 && event.keyCode <= 90 || event.keyCode >= 96 && event.keyCode <= 105) {
    			$$invalidate(0, item.displayValue = event.key, item);
    		}

    		if (event.keyCode === 8) {
    			$$invalidate(0, item.displayValue = " ", item);
    		}

    		callback(item, row, event.keyCode);
    	};

    	const writable_props = ["item", "row", "ref", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NumericCell> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NumericCell", $$slots, []);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, ref = $$value);
    		});
    	}

    	function input_input_handler() {
    		displayValue = this.value;
    		(($$invalidate(2, displayValue), $$invalidate(7, showSolution_value)), $$invalidate(0, item));
    	}

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("row" in $$props) $$invalidate(5, row = $$props.row);
    		if ("ref" in $$props) $$invalidate(1, ref = $$props.ref);
    		if ("callback" in $$props) $$invalidate(6, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		showSolution,
    		showHints,
    		createEventDispatcher,
    		dispatch,
    		showSolution_value,
    		unsubscribe,
    		showHints_value,
    		unsubscribe1,
    		item,
    		row,
    		ref,
    		callback,
    		callCallback,
    		displayValue,
    		inputClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("showSolution_value" in $$props) $$invalidate(7, showSolution_value = $$props.showSolution_value);
    		if ("showHints_value" in $$props) $$invalidate(8, showHints_value = $$props.showHints_value);
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("row" in $$props) $$invalidate(5, row = $$props.row);
    		if ("ref" in $$props) $$invalidate(1, ref = $$props.ref);
    		if ("callback" in $$props) $$invalidate(6, callback = $$props.callback);
    		if ("displayValue" in $$props) $$invalidate(2, displayValue = $$props.displayValue);
    		if ("inputClass" in $$props) $$invalidate(3, inputClass = $$props.inputClass);
    	};

    	let displayValue;
    	let inputClass;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*showSolution_value, item*/ 129) {
    			 $$invalidate(2, displayValue = showSolution_value && item.solutionValue
    			? item.solutionValue
    			: item.displayValue);
    		}

    		if ($$self.$$.dirty & /*item, showHints_value*/ 257) {
    			 $$invalidate(3, inputClass = item.helpInput
    			? "helpInput"
    			: showHints_value && item.solutionValue
    				? item.displayValue === item.solutionValue
    					? "showHints_good"
    					: "showHints_false"
    				: "");
    		}
    	};

    	return [
    		item,
    		ref,
    		displayValue,
    		inputClass,
    		callCallback,
    		row,
    		callback,
    		showSolution_value,
    		showHints_value,
    		dispatch,
    		unsubscribe,
    		unsubscribe1,
    		input_binding,
    		input_input_handler
    	];
    }

    class NumericCell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { item: 0, row: 5, ref: 1, callback: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumericCell",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<NumericCell> was created without expected prop 'item'");
    		}

    		if (/*row*/ ctx[5] === undefined && !("row" in props)) {
    			console.warn("<NumericCell> was created without expected prop 'row'");
    		}

    		if (/*callback*/ ctx[6] === undefined && !("callback" in props)) {
    			console.warn("<NumericCell> was created without expected prop 'callback'");
    		}
    	}

    	get item() {
    		throw new Error("<NumericCell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<NumericCell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get row() {
    		throw new Error("<NumericCell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<NumericCell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<NumericCell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<NumericCell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<NumericCell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<NumericCell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function getCellInfos(operation, level) {
      let operands = GetOperands(operation, level); //[123, 456, 9500];
      return fillCellInfoMatrix(operation, operands);
    }
    function getLevels() {
      let levels = [];
      for (let index = 0; index < 10; index++) {
        levels.push({ id: index + 1, text: `Level ${index + 1}` });
      }
      return levels;
    }
    function getOperations() {
      let operations = [];
      operations.push("+");
      operations.push("-");
      operations.push("*");
      operations.push(":");
      return operations;
    }

    function GetOperands(operation, level) {
      let operands = [];
      let nrOperandDigits;
      switch (operation) {
        case "+":
        case "-":
          let nrOperands = Math.floor(level / 5 + 1) * 2;
          nrOperandDigits = Math.floor(level / 2) + 1;

          for (let index = 0; index < nrOperands; index++) {
            operands.push(getRandomNumber(nrOperandDigits));
          }
          break;
        case "*":
          nrOperandDigits = Math.floor(level / 2) + 2;
          operands.push(getRandomNumber(nrOperandDigits));
          operands.push(getRandomNumber(nrOperandDigits));
        case ":":
          nrOperandDigits = Math.floor(level / 2) + 2;
          operands.push(getRandomNumber(nrOperandDigits));
          nrOperandDigits = Math.floor(level / 3) + 1;
          operands.push(getRandomNumber(nrOperandDigits));
      }

      return operands;
    }

    function getRandomNumber(nrOperandDigits) {
      let min = Math.pow(10, nrOperandDigits - 1);
      let max = Math.pow(10, nrOperandDigits);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function createCellInfoMatrix() {
      let columns = 24;
      let rows = 16;
      let matrix = [];

      for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        let row = [];
        for (let colIndex = 0; colIndex < columns; colIndex++) {
          row.push({ displayValue: " " });
        }
        matrix.push(row);
      }
      return matrix;
    }
    function fillCellInfoMatrix(operation, operands) {
      let matrix = createCellInfoMatrix();
      console.log(operation);
      switch (operation) {
        case "+":
          return fillCellInfosForAddition(operands, matrix);
        case "-":
          return fillCellInfosForSubstraction(operands, matrix);
        case "*":
          return fillCellInfosForMultiplication(operands, matrix);
        case ":":
          return fillCellInfosForDivision(operands, matrix);
      }
    }

    function fillCellInfosForDivision(operands, matrix) {
      let lenOp1 = addNumber({
        number: operands[0],
        matrix,
        rowIndex: 0,
        refColIndex: 1,
      });
      setDisplayValue(":", matrix, 0, lenOp1 + 1);
      let lenOp2 = addNumber({
        number: operands[1],
        matrix,
        rowIndex: 0,
        refColIndex: lenOp1 + 2,
      });
      setDisplayValue("=", matrix, 0, lenOp1 + lenOp2 + 2);
      fillIsTask(matrix, 1, lenOp1 + lenOp2 + 3);
      let result = Math.floor(operands[0] / operands[1]);
      let resultLen = addNumber({
        number: result,
        matrix,
        rowIndex: 0,
        refColIndex: lenOp1 + lenOp2 + 3,
        isResult: true,
      });
      setSolutionValue("R", matrix, 0, lenOp1 + lenOp2 + resultLen + 3);
      let remainder = operands[0] % operands[1];
      addNumber({
        number: remainder,
        matrix,
        rowIndex: 0,
        refColIndex: lenOp1 + lenOp2 + resultLen + 4,
        isResult: true,
      });

      for (let index = 0; index < resultLen; index++) {
        let digit = getDigit(result, index);
        let rowIndex = resultLen * 2 - index * 2 - 1;
        let sub = operands[1] * digit;
        let len = addNumber({
          number: sub,
          matrix,
          rowIndex,
          refColIndex: lenOp1 - index + 1,
          isResult: true,
          alignRight: true,
        });
        setSolutionValue("-", matrix, rowIndex, lenOp1 - index - len);
        setUnderline(matrix, rowIndex, lenOp1 - index - len + 1, lenOp1 - index);
        addNumber({
          number: remainder,
          matrix,
          rowIndex: rowIndex + 1,
          refColIndex: lenOp1 - index + 1 + (index == 0 ? 0 : 1),
          isResult: true,
          alignRight: true,
        });
        remainder = sub + remainder;
      }

      return matrix;
    }

    function fillCellInfosForMultiplication(operands, matrix) {
      let lenOp1 = addNumber({
        number: operands[0],
        matrix,
        rowIndex: 0,
        refColIndex: 0,
      });
      setDisplayValue("*", matrix, 0, lenOp1);
      let lenOp2 = addNumber({
        number: operands[1],
        matrix,
        rowIndex: 0,
        refColIndex: lenOp1 + 1,
      });
      let endIndex = lenOp2 + lenOp1 + 1;
      fillIsTask(matrix, 1, endIndex + 2);

      setHelpInputLine(matrix, lenOp2 + 1);
      setUnderline(matrix, lenOp2 + 1, 0, endIndex);

      setDisplayValue("=", matrix, lenOp2 + 2, 0);
      setIsTask(matrix, lenOp2 + 2, 0);
      addNumber({
        number: operands[0] * operands[1],
        matrix,
        rowIndex: lenOp2 + 2,
        refColIndex: endIndex,
        isResult: true,
        alignRight: true,
      });

      for (let index = 0; index < lenOp2; index++) {
        let digit = getDigit(operands[1], index);
        addNumber({
          number: operands[0] * digit,
          matrix,
          rowIndex: lenOp2 - index,
          refColIndex: endIndex - index,
          isResult: true,
          alignRight: true,
        });
        if (index > 0) {
          setDisplayValue("+", matrix, lenOp2 - index + 1, 0);
          setIsTask(matrix, lenOp2 - index + 1, 0);
        }
      }
      return matrix;
    }
    function getDigit(number, digitIndex) {
      var div = Math.pow(10, digitIndex + 1);
      var rem = number % div;
      return Math.floor(rem / Math.pow(10, digitIndex));
    }

    function fillCellInfosForSubstraction(operands, matrix) {
      let nrOperands = operands.length;
      setDisplayValue("=", matrix, nrOperands + 1, 0);
      setIsTask(matrix, nrOperands + 1, 0);
      const sum = (accumulator, currentValue) => accumulator + currentValue;
      let result = operands.reduce(sum);
      var endIndex = addNumber({
        number: result,
        matrix,
        rowIndex: 0,
        refColIndex: 1,
      });
      fillIsTask(matrix, nrOperands, endIndex + 2);
      for (let index = 0; index < operands.length - 1; index++) {
        const operand = operands[index];
        addNumber({
          number: operand,
          matrix,
          rowIndex: index + 1,
          refColIndex: endIndex + 1,
          alignRight: true,
        });
      }
      for (let index = 1; index < operands.length; index++) {
        setDisplayValue("-", matrix, index, 0);
      }

      var endIndex = addNumber({
        number: operands[operands.length - 1],
        matrix,
        rowIndex: operands.length + 1,
        refColIndex: endIndex + 1,
        isResult: true,
        alignRight: true,
      });

      setHelpInputLine(matrix, nrOperands);
      setUnderline(matrix, nrOperands, 0, endIndex + 1);
      return matrix;
    }

    function fillCellInfosForAddition(operands, matrix) {
      let nrOperands = operands.length;
      setDisplayValue("=", matrix, nrOperands + 1, 0);
      setIsTask(matrix, nrOperands + 1, 0);
      const sum = (accumulator, currentValue) => accumulator + currentValue;
      let result = operands.reduce(sum);
      var endIndex = addNumber({
        number: result,
        matrix,
        rowIndex: nrOperands + 1,
        refColIndex: 1,
        isResult: true,
      });
      fillIsTask(matrix, nrOperands, endIndex + 2);
      for (let index = 0; index < operands.length; index++) {
        const operand = operands[index];
        addNumber({
          number: operand,
          matrix,
          rowIndex: index,
          refColIndex: endIndex + 1,
          alignRight: true,
        });
      }
      for (let index = 1; index < operands.length; index++) {
        setDisplayValue("+", matrix, index, 0);
      }
      setHelpInputLine(matrix, nrOperands);
      setUnderline(matrix, nrOperands, 0, endIndex);
      return matrix;
    }

    function setHelpInputLine(matrix, rowIndex) {
      matrix[rowIndex].forEach((element) => {
        element.helpInput = true;
      });
    }

    function setUnderline(matrix, rowIndex, startColIndex, endColIndex) {
      for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
        matrix[rowIndex][colIndex].underline = true;
      }
    }

    function setDisplayValue(char, matrix, rowIndex, colIndex) {
      matrix[rowIndex][colIndex].displayValue = char;
    }

    function setIsTask(matrix, rowIndex, colIndex) {
      matrix[rowIndex][colIndex].task = true;
    }

    function setSolutionValue(char, matrix, rowIndex, colIndex) {
      matrix[rowIndex][colIndex].solutionValue = char;
    }

    function fillIsTask(matrix, nrRows, nrCols) {
      for (let rowIndex = 0; rowIndex < nrRows; rowIndex++) {
        for (let colIndex = 0; colIndex < nrCols; colIndex++) {
          setIsTask(matrix, rowIndex, colIndex);
        }
      }
    }

    function addNumber({
      number,
      matrix,
      rowIndex,
      refColIndex,
      isResult,
      alignRight,
    }) {
      var chars = number.toString().split("");
      for (var index = 0; index < chars.length; index++) {
        let colIndex = refColIndex + index;
        if (alignRight) colIndex -= chars.length;

        if (isResult) {
          setSolutionValue(chars[index], matrix, rowIndex, colIndex);
        } else {
          setDisplayValue(chars[index], matrix, rowIndex, colIndex);
        }
      }
      return index;
    }

    /* src\App.svelte generated by Svelte v3.20.1 */
    const file$1 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[27] = list;
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (64:6) {#each row as cellInfo (cellInfo)}
    function create_each_block_3(key_1, ctx) {
    	let td;
    	let updating_ref;
    	let current;

    	function numericcell_ref_binding(value) {
    		/*numericcell_ref_binding*/ ctx[11].call(null, value, /*cellInfo*/ ctx[26]);
    	}

    	let numericcell_props = {
    		item: /*cellInfo*/ ctx[26],
    		row: /*row*/ ctx[23],
    		callback: /*callback*/ ctx[7]
    	};

    	if (/*cellInfo*/ ctx[26].cellInput !== void 0) {
    		numericcell_props.ref = /*cellInfo*/ ctx[26].cellInput;
    	}

    	const numericcell = new NumericCell({ props: numericcell_props, $$inline: true });
    	binding_callbacks.push(() => bind(numericcell, "ref", numericcell_ref_binding));

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			create_component(numericcell.$$.fragment);
    			attr_dev(td, "class", "svelte-7q4cby");
    			add_location(td, file$1, 64, 8, 1389);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			mount_component(numericcell, td, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const numericcell_changes = {};
    			if (dirty & /*cellInfos*/ 4) numericcell_changes.item = /*cellInfo*/ ctx[26];
    			if (dirty & /*cellInfos*/ 4) numericcell_changes.row = /*row*/ ctx[23];

    			if (!updating_ref && dirty & /*cellInfos*/ 4) {
    				updating_ref = true;
    				numericcell_changes.ref = /*cellInfo*/ ctx[26].cellInput;
    				add_flush_callback(() => updating_ref = false);
    			}

    			numericcell.$set(numericcell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numericcell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numericcell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			destroy_component(numericcell);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(64:6) {#each row as cellInfo (cellInfo)}",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#each cellInfos as row}
    function create_each_block_2(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let current;
    	let each_value_3 = /*row*/ ctx[23];
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*cellInfo*/ ctx[26];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$1, 62, 4, 1335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cellInfos, callback*/ 132) {
    				const each_value_3 = /*row*/ ctx[23];
    				validate_each_argument(each_value_3);
    				group_outros();
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, tr, outro_and_destroy_block, create_each_block_3, t, get_each_context_3);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(62:2) {#each cellInfos as row}",
    		ctx
    	});

    	return block;
    }

    // (85:2) {#each operations as operation}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*operation*/ ctx[20] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*operation*/ ctx[20];
    			option.value = option.__value;
    			add_location(option, file$1, 85, 4, 1910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(85:2) {#each operations as operation}",
    		ctx
    	});

    	return block;
    }

    // (90:2) {#each levels as level}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*level*/ ctx[17].text + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*level*/ ctx[17].id;
    			option.value = option.__value;
    			add_location(option, file$1, 90, 4, 2043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(90:2) {#each levels as level}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let table;
    	let t0;
    	let button0;

    	let t1_value = (/*showSolution_value*/ ctx[3]
    	? "Hide solution"
    	: "Show solution") + "";

    	let t1;
    	let t2;
    	let button1;
    	let t3_value = (/*showHints_value*/ ctx[4] ? "Hide hints" : "Show hints") + "";
    	let t3;
    	let t4;
    	let br;
    	let t5;
    	let select0;
    	let t6;
    	let select1;
    	let t7;
    	let button2;
    	let current;
    	let dispose;
    	let each_value_2 = /*cellInfos*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_1 = /*operations*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*levels*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();
    			button0 = element("button");
    			t1 = text(t1_value);
    			t2 = space();
    			button1 = element("button");
    			t3 = text(t3_value);
    			t4 = space();
    			br = element("br");
    			t5 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "New task";
    			attr_dev(table, "cellspacing", "0");
    			add_location(table, file$1, 60, 0, 1280);
    			attr_dev(button0, "class", "svelte-7q4cby");
    			add_location(button0, file$1, 76, 0, 1589);
    			attr_dev(button1, "class", "svelte-7q4cby");
    			add_location(button1, file$1, 79, 0, 1713);
    			add_location(br, file$1, 82, 0, 1825);
    			if (/*selectedOperation*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[14].call(select0));
    			add_location(select0, file$1, 83, 0, 1832);
    			if (/*selectedLevel*/ ctx[1] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[15].call(select1));
    			add_location(select1, file$1, 88, 0, 1977);
    			attr_dev(button2, "class", "svelte-7q4cby");
    			add_location(button2, file$1, 93, 0, 2110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(table, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, select0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*selectedOperation*/ ctx[0]);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, select1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*selectedLevel*/ ctx[1]);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button2, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[12], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[13], false, false, false),
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[14]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[15]),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cellInfos, callback*/ 132) {
    				each_value_2 = /*cellInfos*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    						transition_in(each_blocks_2[i], 1);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						transition_in(each_blocks_2[i], 1);
    						each_blocks_2[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*showSolution_value*/ 8) && t1_value !== (t1_value = (/*showSolution_value*/ ctx[3]
    			? "Hide solution"
    			: "Show solution") + "")) set_data_dev(t1, t1_value);

    			if ((!current || dirty & /*showHints_value*/ 16) && t3_value !== (t3_value = (/*showHints_value*/ ctx[4] ? "Hide hints" : "Show hints") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*operations*/ 32) {
    				each_value_1 = /*operations*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectedOperation*/ 1) {
    				select_option(select0, /*selectedOperation*/ ctx[0]);
    			}

    			if (dirty & /*levels*/ 64) {
    				each_value = /*levels*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedLevel*/ 2) {
    				select_option(select1, /*selectedLevel*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_2 = each_blocks_2.filter(Boolean);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(select0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(select1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let selectedOperation = ":";
    	let operations = getOperations();
    	let selectedLevel = 5;
    	let levels = getLevels();
    	let cellInfos = getCellInfos(selectedOperation, selectedLevel);
    	let lastAddedCell;
    	let showSolution_value;

    	const unsubscribe0 = showSolution.subscribe(value => {
    		$$invalidate(3, showSolution_value = value);
    	});

    	let showHints_value;

    	const unsubscribe1 = showHints.subscribe(value => {
    		$$invalidate(4, showHints_value = value);
    	});

    	const callback = (item, row, keyCode) => {
    		var rowIndex = cellInfos.indexOf(row);
    		var cellIndex = cellInfos[rowIndex].indexOf(item);

    		switch (keyCode) {
    			case 8:
    			case 37:
    				cellIndex--;
    				break;
    			case 38:
    				rowIndex--;
    				break;
    			case 40:
    				// down
    				rowIndex++;
    				break;
    			case 39:
    				cellIndex++;
    				break;
    		} // left
    		// up

    		var next = cellInfos[rowIndex][cellIndex];
    		next.cellInput.focus();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function numericcell_ref_binding(value, cellInfo) {
    		cellInfo.cellInput = value;
    		$$invalidate(2, cellInfos);
    	}

    	const click_handler = () => showSolution.update(n => !n);
    	const click_handler_1 = () => showHints.update(n => !n);

    	function select0_change_handler() {
    		selectedOperation = select_value(this);
    		$$invalidate(0, selectedOperation);
    		$$invalidate(5, operations);
    	}

    	function select1_change_handler() {
    		selectedLevel = select_value(this);
    		$$invalidate(1, selectedLevel);
    		$$invalidate(6, levels);
    	}

    	const click_handler_2 = () => $$invalidate(2, cellInfos = getCellInfos(selectedOperation, selectedLevel));

    	$$self.$capture_state = () => ({
    		showSolution,
    		showHints,
    		NumericCell,
    		getCellInfos,
    		getLevels,
    		getOperations,
    		selectedOperation,
    		operations,
    		selectedLevel,
    		levels,
    		cellInfos,
    		lastAddedCell,
    		showSolution_value,
    		unsubscribe0,
    		showHints_value,
    		unsubscribe1,
    		callback
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedOperation" in $$props) $$invalidate(0, selectedOperation = $$props.selectedOperation);
    		if ("operations" in $$props) $$invalidate(5, operations = $$props.operations);
    		if ("selectedLevel" in $$props) $$invalidate(1, selectedLevel = $$props.selectedLevel);
    		if ("levels" in $$props) $$invalidate(6, levels = $$props.levels);
    		if ("cellInfos" in $$props) $$invalidate(2, cellInfos = $$props.cellInfos);
    		if ("lastAddedCell" in $$props) lastAddedCell = $$props.lastAddedCell;
    		if ("showSolution_value" in $$props) $$invalidate(3, showSolution_value = $$props.showSolution_value);
    		if ("showHints_value" in $$props) $$invalidate(4, showHints_value = $$props.showHints_value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedOperation,
    		selectedLevel,
    		cellInfos,
    		showSolution_value,
    		showHints_value,
    		operations,
    		levels,
    		callback,
    		lastAddedCell,
    		unsubscribe0,
    		unsubscribe1,
    		numericcell_ref_binding,
    		click_handler,
    		click_handler_1,
    		select0_change_handler,
    		select1_change_handler,
    		click_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

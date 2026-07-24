import { Category, Difficulty } from '../types';

export const WordCategories: Record<Category, string[]> = {
  easy_words: [
    'cat', 'dog', 'fish', 'sun', 'run', 'jump', 'play', 'tree', 'ice', 'snow',
    'cold', 'hot', 'blue', 'red', 'wet', 'dry', 'fun', 'swim', 'walk', 'bird',
    'hat', 'coat', 'sky', 'sea', 'land', 'wind', 'fire', 'wood', 'rock', 'sand',
    'star', 'void', 'ship', 'mars', 'glow', 'beam', 'wave', 'dust', 'light', 'dark',
    'atom', 'grid', 'byte', 'core', 'disk', 'file', 'port', 'code', 'loop', 'ping',
    'hash', 'link', 'key', 'path', 'node', 'time', 'zoom', 'view', 'soft', 'hard',
    'moon', 'earth', 'plug', 'plug', 'data', 'user', 'test', 'logs', 'plot', 'sync'
  ],
  animals: [
    'cat', 'dog', 'bird', 'fish', 'frog', 'lion', 'bear', 'wolf', 'deer', 'duck', 'hawk', 'crab', 'seal', 'ape', 'bull', 'cow', 'pig', 'goat', 'sheep', 'ant', 'bee', 'owl', 'fox', 'elk',
    'penguin', 'dolphin', 'cheetah', 'octopus', 'giraffe', 'kangaroo', 'elephant', 'alligator',
    'hamster', 'squirrel', 'panther', 'leopard', 'platypus', 'koala', 'badger', 'meerkat',
    'chameleon', 'jellyfish', 'seahorse', 'hedgehog', 'flamingo', 'gorilla', 'walrus', 'narwhal',
    'barracuda', 'chimpanzee', 'crocodile', 'wolverine', 'porcupine', 'salamander', 'tarantula',
    'armadillo', 'albatross', 'bumblebee', 'caterpillar', 'dragonfly', 'woodpecker', 'hummingbird',
    'grasshopper', 'nightingale', 'barracuda', 'chimpanzee', 'jellyfish', 'seahorse'
  ],
  technology: [
    'tech', 'data', 'byte', 'code', 'link', 'ping', 'port', 'node', 'disk', 'chip', 'web', 'net', 'wifi', 'user', 'host', 'sync', 'hack', 'load', 'grid', 'core', 'cpu', 'ram', 'rom', 'plug', 'file',
    'computer', 'keyboard', 'software', 'database', 'internet', 'network', 'processor', 'circuit',
    'monitor', 'algorithm', 'security', 'firewall', 'terminal', 'pixel', 'server', 'protocol',
    'compiler', 'hardware', 'interface', 'router', 'gateway', 'storage', 'backup', 'cookie',
    'cybersecurity', 'cryptography', 'artificial', 'intelligence', 'automation', 'virtualization',
    'mainframe', 'telemetry', 'microchip', 'transistor', 'fiberoptic', 'broadband', 'bandwidth',
    'hypertext', 'encryption', 'decryption', 'cloud', 'blockchain', 'biometrics', 'nanotechnology'
  ],
  space: [
    'sun', 'moon', 'star', 'mars', 'void', 'dust', 'sky', 'nova', 'orb', 'axis', 'dome', 'halo', 'ray', 'warp', 'sol', 'zen', 'gale', 'comet', 'orbit', 'astro', 'alien', 'rover', 'space',
    'galaxy', 'nebula', 'asteroid', 'comet', 'meteor', 'planet', 'jupiter', 'saturn', 'universe',
    'telescope', 'astronaut', 'gravity', 'satellite', 'eclipse', 'orbit', 'supernova', 'cosmos',
    'starlight', 'void', 'crater', 'shuttle', 'aurora', 'pulsar', 'quasar', 'exoplanet',
    'constellation', 'multiverse', 'spacetime', 'heliosphere', 'astronomy', 'stratosphere',
    'troposphere', 'magnetosphere', 'interstellar', 'cosmology', 'astrobiology', 'observatory',
    'solstice', 'equinox', 'parsec', 'lightyear', 'telemetry', 'spacetravel', 'wormhole'
  ],
  fruits_colors: [
    'red', 'blue', 'pink', 'lime', 'plum', 'pear', 'kiwi', 'grape', 'peach', 'berry', 'melon', 'fig', 'date', 'gold', 'gray', 'rose', 'teal', 'cyan', 'mint', 'zinc',
    'strawberry', 'blueberry', 'pineapple', 'watermelon', 'crimson', 'emerald', 'sapphire', 'tangerine',
    'magenta', 'turquoise', 'lavender', 'pomegranate', 'avocado', 'grapefruit', 'obsidian', 'amethyst',
    'marigold', 'cinnamon', 'charcoal', 'coconut', 'apricot', 'cantaloupe', 'chestnut', 'mulberry',
    'boysenberry', 'huckleberry', 'persimmon', 'elderberry', 'periwinkle', 'aquamarine', 'chartreuse',
    'vermilion', 'honeydew', 'cranberry', 'tangerine', 'raspberry', 'blackberry', 'gooseberry'
  ],
  programming: [
    'dev', 'run', 'loop', 'test', 'bug', 'api', 'key', 'git', 'null', 'true', 'var', 'let', 'func', 'init', 'code', 'hash', 'tree', 'map', 'set', 'list', 'math', 'heap', 'stack', 'push', 'pop', 'shift',
    'function', 'variable', 'statement', 'argument', 'compiler', 'recursive', 'asynchronous', 'inheritance',
    'polymorphism', 'interface', 'javascript', 'typescript', 'framework', 'callback', 'closure', 'middleware',
    'dependency', 'repository', 'deployment', 'component', 'serializable', 'constructor', 'parameter', 'validation',
    'encapsulation', 'abstraction', 'instantiation', 'concurrency', 'multithreading', 'synchronization',
    'compilation', 'refactoring', 'optimization', 'serialization', 'deserialization', 'architecture', 'inheritance'
  ]
};

const LettersEasy = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LettersMedium = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LettersHard = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'.split('');

/**
 * Returns a random word from the specified category and scaled for the given difficulty and level.
 */
export function getRandomWord(category: Category, difficulty: Difficulty, level: number): string {
  const words = WordCategories[category] || WordCategories.easy_words;
  
  // Filter words by length depending on difficulty and level
  let minLength = 3;
  let maxLength = 6;

  if (difficulty === 'easy') {
    minLength = 3;
    maxLength = Math.min(5 + Math.floor(level / 2), 7);
  } else if (difficulty === 'medium') {
    minLength = 4 + Math.floor(level / 3);
    maxLength = Math.min(7 + Math.floor(level / 2), 10);
  } else {
    minLength = 5 + Math.floor(level / 2);
    maxLength = 15;
  }

  // Ensure there's a fallback if filters are too strict
  const eligibleWords = words.filter(word => word.length >= minLength && word.length <= maxLength);
  const wordSource = eligibleWords.length > 0 ? eligibleWords : words;

  return wordSource[Math.floor(Math.random() * wordSource.length)];
}

/**
 * Returns a random letter depending on the difficulty and level.
 */
export function getRandomLetter(difficulty: Difficulty, level: number): string {
  // Harder levels introduce upper case and special chars
  if (difficulty === 'easy' && level < 4) {
    return LettersEasy[Math.floor(Math.random() * LettersEasy.length)];
  } else if (difficulty === 'medium' || (difficulty === 'easy' && level >= 4)) {
    // 80% lowercase, 20% uppercase
    if (Math.random() < 0.2) {
      return LettersMedium[Math.floor(Math.random() * 26) + 26]; // Uppercase
    }
    return LettersEasy[Math.floor(Math.random() * LettersEasy.length)];
  } else {
    // Hard difficulty: mix of upper/lower case and special characters
    const rand = Math.random();
    if (rand < 0.6) {
      return LettersEasy[Math.floor(Math.random() * LettersEasy.length)];
    } else if (rand < 0.85) {
      return LettersMedium[Math.floor(Math.random() * 26) + 26]; // Uppercase
    } else {
      return LettersHard[Math.floor(Math.random() * (LettersHard.length - 52)) + 52]; // Numbers & symbols
    }
  }
}

/**
 * Returns a random short word (2-4 chars) from a category for Comet Zap mode.
 */
export function getRandomShortWord(category: Category, difficulty: Difficulty, level: number): string {
  const words = WordCategories[category] || WordCategories.easy_words;
  
  let minLength = 2;
  let maxLength = 4;

  if (difficulty === 'easy') {
    minLength = 2;
    maxLength = 3;
  } else if (difficulty === 'medium') {
    minLength = 3;
    maxLength = 4;
  } else {
    minLength = 3;
    maxLength = 5;
  }

  const eligibleWords = words.filter(word => word.length >= minLength && word.length <= maxLength);
  const wordSource = eligibleWords.length > 0 ? eligibleWords : WordCategories.easy_words.filter(word => word.length >= minLength && word.length <= maxLength);
  const finalSource = wordSource.length > 0 ? wordSource : ['zap', 'star', 'void', 'ship', 'sky', 'sun', 'nova', 'comet'];

  return finalSource[Math.floor(Math.random() * finalSource.length)];
}

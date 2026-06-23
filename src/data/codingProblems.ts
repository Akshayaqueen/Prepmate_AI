/**
 * Seeded coding problems for the in-app code editor (Part 1 — editor only,
 * no execution). Each problem ships starter templates per language.
 */

export type EditorLanguage = 'javascript' | 'python' | 'java' | 'cpp';

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  statement: string;
  examples: { input: string; output: string }[];
  starter: Record<EditorLanguage, string>;
}

export const LANGUAGES: { id: EditorLanguage; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays / Hashing',
    statement:
      'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume exactly one solution exists.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    starter: {
      javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
      python: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) return {seen[need], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
    },
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    topic: 'Two Pointers',
    statement:
      'Write a function that reverses a string. The input is given as an array of characters. Modify it in-place with O(1) extra memory.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
    ],
    starter: {
      javascript: `function reverseString(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    [s[l], s[r]] = [s[r], s[l]];
    l++; r--;
  }
  return s;
}`,
      python: `def reverse_string(s):
    l, r = 0, len(s) - 1
    while l < r:
        s[l], s[r] = s[r], s[l]
        l += 1
        r -= 1
    return s`,
      java: `class Solution {
    public void reverseString(char[] s) {
        int l = 0, r = s.length - 1;
        while (l < r) {
            char t = s[l]; s[l] = s[r]; s[r] = t;
            l++; r--;
        }
    }
}`,
      cpp: `void reverseString(vector<char>& s) {
    int l = 0, r = s.size() - 1;
    while (l < r) swap(s[l++], s[r--]);
}`,
    },
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    statement:
      'Given a string s containing just the characters (), {} and [], determine if the input string is valid. Brackets must close in the correct order.',
    examples: [
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    starter: {
      javascript: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
      python: `def is_valid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`,
      java: `class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(') stack.push(')');
            else if (ch == '[') stack.push(']');
            else if (ch == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != ch) return false;
        }
        return stack.isEmpty();
    }
}`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    for (char ch : s) {
        if (ch == '(') st.push(')');
        else if (ch == '[') st.push(']');
        else if (ch == '{') st.push('}');
        else if (st.empty() || st.top() != ch) return false;
        else st.pop();
    }
    return st.empty();
}`,
    },
  },
];

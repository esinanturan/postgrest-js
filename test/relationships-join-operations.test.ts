import { PostgrestClient } from '../src/index'
import { Database, CustomUserDataType } from './types.override'
import { expectType } from 'tsd'
import { TypeEqual } from 'ts-expect'
import { Prettify } from '../src/types'

const REST_URL = 'http://localhost:3000'
export const postgrest = new PostgrestClient<Database>(REST_URL)
const userColumn: 'catchphrase' | 'username' = 'username'

test('!inner relationship', async () => {
  const res = await postgrest
    .from('messages')
    .select('channels!inner(*, channel_details!inner(*))')
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "channels": Object {
          "channel_details": Object {
            "details": "Details for public channel",
            "id": 1,
          },
          "data": null,
          "id": 1,
          "slug": "public",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  type ExpectedType = Prettify<
    Database['public']['Tables']['channels']['Row'] & {
      channel_details: Database['public']['Tables']['channel_details']['Row']
    }
  >
  let expected: {
    channels: ExpectedType
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!inner relationship on nullable relation', async () => {
  const res = await postgrest.from('booking').select('id, hotel!inner(id, name)')
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Array [
        Object {
          "hotel": Object {
            "id": 1,
            "name": "Sunset Resort",
          },
          "id": 1,
        },
        Object {
          "hotel": Object {
            "id": 1,
            "name": "Sunset Resort",
          },
          "id": 2,
        },
        Object {
          "hotel": Object {
            "id": 2,
            "name": "Mountain View Hotel",
          },
          "id": 3,
        },
        Object {
          "hotel": Object {
            "id": 3,
            "name": "Beachfront Inn",
          },
          "id": 5,
        },
        Object {
          "hotel": Object {
            "id": 1,
            "name": "Sunset Resort",
          },
          "id": 6,
        },
        Object {
          "hotel": Object {
            "id": 4,
            "name": null,
          },
          "id": 8,
        },
      ],
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: Array<{
    id: number
    hotel: {
      id: number
      name: string | null
    }
  }>
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left oneToOne', async () => {
  const res = await postgrest.from('channel_details').select('channels!left(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "channels": Object {
          "data": null,
          "id": 1,
          "slug": "public",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    channels: Database['public']['Tables']['channels']['Row']
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left oneToMany', async () => {
  const res = await postgrest.from('users').select('messages!left(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "messages": Array [
          Object {
            "channel_id": 1,
            "data": null,
            "id": 1,
            "message": "Hello World 👋",
            "username": "supabot",
          },
          Object {
            "channel_id": 2,
            "data": null,
            "id": 2,
            "message": "Perfection is attained, not when there is nothing more to add, but when there is nothing left to take away.",
            "username": "supabot",
          },
          Object {
            "channel_id": 3,
            "data": null,
            "id": 4,
            "message": "Some message on channel wihtout details",
            "username": "supabot",
          },
        ],
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    messages: Array<Omit<Database['public']['Tables']['messages']['Row'], 'blurb_message'>>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left zeroToOne', async () => {
  const res = await postgrest.from('user_profiles').select('users!left(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "users": Object {
          "age_range": "[1,2)",
          "catchphrase": "'cat' 'fat'",
          "data": null,
          "status": "ONLINE",
          "username": "supabot",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    users: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join over a 1-1 relation with both nullables and non-nullables fields using foreign key name for hinting', async () => {
  const res = await postgrest
    .from('best_friends')
    .select(
      'first_user:users!best_friends_first_user_fkey(*), second_user:users!best_friends_second_user_fkey(*), third_wheel:users!best_friends_third_wheel_fkey(*)'
    )
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_user": Object {
          "age_range": "[1,2)",
          "catchphrase": "'cat' 'fat'",
          "data": null,
          "status": "ONLINE",
          "username": "supabot",
        },
        "second_user": Object {
          "age_range": "[25,35)",
          "catchphrase": "'bat' 'cat'",
          "data": null,
          "status": "OFFLINE",
          "username": "kiwicopple",
        },
        "third_wheel": Object {
          "age_range": "[25,35)",
          "catchphrase": "'bat' 'rat'",
          "data": null,
          "status": "ONLINE",
          "username": "awailas",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_user: Database['public']['Tables']['users']['Row']
    second_user: Database['public']['Tables']['users']['Row']
    third_wheel: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join over a 1-M relation with both nullables and non-nullables fields using foreign key name for hinting', async () => {
  const res = await postgrest
    .from('users')
    .select(
      `first_friend_of:best_friends!best_friends_first_user_fkey(*),
        second_friend_of:best_friends!best_friends_second_user_fkey(*),
        third_wheel_of:best_friends!best_friends_third_wheel_fkey(*)`
    )
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_friend_of": Array [
          Object {
            "first_user": "supabot",
            "id": 1,
            "second_user": "kiwicopple",
            "third_wheel": "awailas",
          },
          Object {
            "first_user": "supabot",
            "id": 2,
            "second_user": "awailas",
            "third_wheel": null,
          },
        ],
        "second_friend_of": Array [],
        "third_wheel_of": Array [],
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    second_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    third_wheel_of: Array<Database['public']['Tables']['best_friends']['Row']>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join on 1-M relation', async () => {
  const res = await postgrest
    .from('users')
    .select(
      `first_friend_of:best_friends_first_user_fkey(*),
        second_friend_of:best_friends_second_user_fkey(*),
        third_wheel_of:best_friends_third_wheel_fkey(*)`
    )
    .eq('username', 'supabot')
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_friend_of": Array [
          Object {
            "first_user": "supabot",
            "id": 1,
            "second_user": "kiwicopple",
            "third_wheel": "awailas",
          },
          Object {
            "first_user": "supabot",
            "id": 2,
            "second_user": "awailas",
            "third_wheel": null,
          },
        ],
        "second_friend_of": Array [],
        "third_wheel_of": Array [],
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    second_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    third_wheel_of: Array<Database['public']['Tables']['best_friends']['Row']>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join on 1-1 relation with nullables', async () => {
  const res = await postgrest
    .from('best_friends')
    .select(
      'first_user:users!best_friends_first_user_fkey(*), second_user:users!best_friends_second_user_fkey(*), third_wheel:users!best_friends_third_wheel_fkey(*)'
    )
    .order('id')
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_user": Object {
          "age_range": "[1,2)",
          "catchphrase": "'cat' 'fat'",
          "data": null,
          "status": "ONLINE",
          "username": "supabot",
        },
        "second_user": Object {
          "age_range": "[25,35)",
          "catchphrase": "'bat' 'cat'",
          "data": null,
          "status": "OFFLINE",
          "username": "kiwicopple",
        },
        "third_wheel": Object {
          "age_range": "[25,35)",
          "catchphrase": "'bat' 'rat'",
          "data": null,
          "status": "ONLINE",
          "username": "awailas",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_user: Database['public']['Tables']['users']['Row']
    second_user: Database['public']['Tables']['users']['Row']
    third_wheel: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join over a 1-1 relation with both nullablesand non-nullables fields with column name hinting', async () => {
  const res = await postgrest
    .from('best_friends')
    .select(
      'first_user:users!first_user(*), second_user:users!second_user(*), third_wheel:users!third_wheel(*)'
    )
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_user": Object {
          "age_range": "[1,2)",
          "catchphrase": "'cat' 'fat'",
          "data": null,
          "status": "ONLINE",
          "username": "supabot",
        },
        "second_user": Object {
          "age_range": "[25,35)",
          "catchphrase": "'bat' 'cat'",
          "data": null,
          "status": "OFFLINE",
          "username": "kiwicopple",
        },
        "third_wheel": Object {
          "age_range": "[25,35)",
          "catchphrase": "'bat' 'rat'",
          "data": null,
          "status": "ONLINE",
          "username": "awailas",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_user: Database['public']['Tables']['users']['Row']
    second_user: Database['public']['Tables']['users']['Row']
    third_wheel: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join over a 1-M relation with both nullables and non-nullables fields using column name for hinting', async () => {
  const res = await postgrest
    .from('users')
    .select(
      'first_friend_of:best_friends!first_user(*), second_friend_of:best_friends!second_user(*), third_wheel_of:best_friends!third_wheel(*)'
    )
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_friend_of": Array [
          Object {
            "first_user": "supabot",
            "id": 1,
            "second_user": "kiwicopple",
            "third_wheel": "awailas",
          },
          Object {
            "first_user": "supabot",
            "id": 2,
            "second_user": "awailas",
            "third_wheel": null,
          },
        ],
        "second_friend_of": Array [],
        "third_wheel_of": Array [],
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    second_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    third_wheel_of: Array<Database['public']['Tables']['best_friends']['Row']>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join over a 1-M relation with both nullables and non-nullables fields using column name hinting on nested relation', async () => {
  const res = await postgrest
    .from('users')
    .select(
      'first_friend_of:best_friends!first_user(*, first_user:users!first_user(*)), second_friend_of:best_friends!second_user(*), third_wheel_of:best_friends!third_wheel(*)'
    )
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "first_friend_of": Array [
          Object {
            "first_user": Object {
              "age_range": "[1,2)",
              "catchphrase": "'cat' 'fat'",
              "data": null,
              "status": "ONLINE",
              "username": "supabot",
            },
            "id": 1,
            "second_user": "kiwicopple",
            "third_wheel": "awailas",
          },
          Object {
            "first_user": Object {
              "age_range": "[1,2)",
              "catchphrase": "'cat' 'fat'",
              "data": null,
              "status": "ONLINE",
              "username": "supabot",
            },
            "id": 2,
            "second_user": "awailas",
            "third_wheel": null,
          },
        ],
        "second_friend_of": Array [],
        "third_wheel_of": Array [],
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  type ExpectedType = Prettify<
    Database['public']['Tables']['best_friends']['Row'] & {
      first_user: string & Database['public']['Tables']['users']['Row']
    }
  >
  let expected: {
    first_friend_of: ExpectedType[]
    second_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    third_wheel_of: Array<Database['public']['Tables']['best_friends']['Row']>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left join on one to 0-1 non-empty relation', async () => {
  const res = await postgrest
    .from('users')
    .select('user_profiles!left(username)')
    .eq('username', 'supabot')
    .limit(1)
    .single()
  expect(Array.isArray(res.data?.user_profiles)).toBe(true)
  expect(res.data?.user_profiles[0].username).not.toBeNull()
  expect(res).toMatchInlineSnapshot(`
        Object {
          "count": null,
          "data": Object {
            "user_profiles": Array [
              Object {
                "username": "supabot",
              },
            ],
          },
          "error": null,
          "status": 200,
          "statusText": "OK",
        }
      `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    user_profiles: Array<Pick<Database['public']['Tables']['user_profiles']['Row'], 'username'>>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join on one to 0-1 non-empty relation via column name', async () => {
  const res = await postgrest
    .from('users')
    .select('user_profiles(username)')
    .eq('username', 'supabot')
    .limit(1)
    .single()
  expect(res.error).toBeNull()
  expect(Array.isArray(res.data?.user_profiles)).toBe(true)
  expect(res.data?.user_profiles[0].username).not.toBeNull()
  expect(res).toMatchInlineSnapshot(`
      Object {
        "count": null,
        "data": Object {
          "user_profiles": Array [
            Object {
              "username": "supabot",
            },
          ],
        },
        "error": null,
        "status": 200,
        "statusText": "OK",
      }
    `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    user_profiles: Array<Pick<Database['public']['Tables']['user_profiles']['Row'], 'username'>>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left join on zero to one with null relation', async () => {
  const res = await postgrest
    .from('user_profiles')
    .select('*,users!left(*)')
    .eq('id', 2)
    .limit(1)
    .single()
  expect(Array.isArray(res.data?.users)).toBe(false)
  expect(res.data?.users).toBeNull()

  expect(res).toMatchInlineSnapshot(`
        Object {
          "count": null,
          "data": Object {
            "id": 2,
            "username": null,
            "users": null,
          },
          "error": null,
          "status": 200,
          "statusText": "OK",
        }
      `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    id: number
    username: string | null
    users: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left join on zero to one with valid relation', async () => {
  const res = await postgrest
    .from('user_profiles')
    .select('*,users!left(status)')
    .eq('id', 1)
    .limit(1)
    .single()
  expect(Array.isArray(res.data?.users)).toBe(false)
  // TODO: This should be nullable indeed
  expect(res.data?.users?.status).not.toBeNull()

  expect(res).toMatchInlineSnapshot(`
        Object {
          "count": null,
          "data": Object {
            "id": 1,
            "username": "supabot",
            "users": Object {
              "status": "ONLINE",
            },
          },
          "error": null,
          "status": 200,
          "statusText": "OK",
        }
      `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    id: number
    username: string | null
    users: Pick<Database['public']['Tables']['users']['Row'], 'status'> | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('!left join on zero to one empty relation', async () => {
  const res = await postgrest
    .from('users')
    .select('user_profiles!left(username)')
    .eq('username', 'dragarcia')
    .limit(1)
    .single()
  expect(res.data).toMatchInlineSnapshot(`
    Object {
      "user_profiles": Array [],
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    user_profiles: Array<Pick<Database['public']['Tables']['user_profiles']['Row'], 'username'>>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join on 1-M relation with selective fk hinting', async () => {
  const res = await postgrest
    .from('users')
    .select(
      `first_friend_of:best_friends_first_user_fkey(id),
        second_friend_of:best_friends_second_user_fkey(*),
        third_wheel_of:best_friends_third_wheel_fkey(*)`
    )
    .limit(1)
    .single()
  expect(Array.isArray(res.data?.first_friend_of)).toBe(true)
  expect(Array.isArray(res.data?.second_friend_of)).toBe(true)
  expect(Array.isArray(res.data?.third_wheel_of)).toBe(true)
  expect(res).toMatchInlineSnapshot(`
      Object {
        "count": null,
        "data": Object {
          "first_friend_of": Array [
            Object {
              "id": 1,
            },
            Object {
              "id": 2,
            },
          ],
          "second_friend_of": Array [],
          "third_wheel_of": Array [],
        },
        "error": null,
        "status": 200,
        "statusText": "OK",
      }
    `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    first_friend_of: Array<Pick<Database['public']['Tables']['best_friends']['Row'], 'id'>>
    second_friend_of: Array<Database['public']['Tables']['best_friends']['Row']>
    third_wheel_of: Array<Database['public']['Tables']['best_friends']['Row']>
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join select via column', async () => {
  const res = await postgrest.from('user_profiles').select('username(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
      Object {
        "count": null,
        "data": Object {
          "username": Object {
            "age_range": "[1,2)",
            "catchphrase": "'cat' 'fat'",
            "data": null,
            "status": "ONLINE",
            "username": "supabot",
          },
        },
        "error": null,
        "status": 200,
        "statusText": "OK",
      }
    `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    username: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join select via column selective', async () => {
  const res = await postgrest.from('user_profiles').select('username(status)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
      Object {
        "count": null,
        "data": Object {
          "username": Object {
            "status": "ONLINE",
          },
        },
        "error": null,
        "status": 200,
        "statusText": "OK",
      }
    `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    username: {
      status: Database['public']['Enums']['user_status'] | null
    } | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join select via column and alias', async () => {
  const res = await postgrest.from('user_profiles').select('user:username(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
      Object {
        "count": null,
        "data": Object {
          "user": Object {
            "age_range": "[1,2)",
            "catchphrase": "'cat' 'fat'",
            "data": null,
            "status": "ONLINE",
            "username": "supabot",
          },
        },
        "error": null,
        "status": 200,
        "statusText": "OK",
      }
    `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    user: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join select via unique table relationship', async () => {
  const res = await postgrest.from('user_profiles').select('users(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
      Object {
        "count": null,
        "data": Object {
          "users": Object {
            "age_range": "[1,2)",
            "catchphrase": "'cat' 'fat'",
            "data": null,
            "status": "ONLINE",
            "username": "supabot",
          },
        },
        "error": null,
        "status": 200,
        "statusText": "OK",
      }
    `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    users: Database['public']['Tables']['users']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join select via view name relationship', async () => {
  const res = await postgrest.from('user_profiles').select('updatable_view(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "updatable_view": Object {
          "non_updatable_column": 1,
          "username": "supabot",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    updatable_view: Database['public']['Views']['updatable_view']['Row'] | null
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join select via column with string templating', async () => {
  const res = await postgrest.from('users').select(`status, ${userColumn}`).limit(1).single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "status": "ONLINE",
        "username": "supabot",
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    status: Database['public']['Enums']['user_status'] | null
    username: string
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('join with column hinting', async () => {
  const res = await postgrest.from('best_friends').select('users!first_user(*)').limit(1).single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "users": Object {
          "age_range": "[1,2)",
          "catchphrase": "'cat' 'fat'",
          "data": null,
          "status": "ONLINE",
          "username": "supabot",
        },
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    users: {
      age_range: unknown | null
      catchphrase: unknown | null
      data: CustomUserDataType | null
      status: Database['public']['Enums']['user_status'] | null
      username: string
    }
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})

test('inner join on many relation', async () => {
  const res = await postgrest
    .from('channels')
    .select('id, messages!channel_id!inner(id, username)')
    .limit(1)
    .single()
  expect(res).toMatchInlineSnapshot(`
    Object {
      "count": null,
      "data": Object {
        "id": 1,
        "messages": Array [
          Object {
            "id": 1,
            "username": "supabot",
          },
        ],
      },
      "error": null,
      "status": 200,
      "statusText": "OK",
    }
  `)
  let result: Exclude<typeof res.data, null>
  let expected: {
    id: number
    messages: {
      id: number
      username: string
    }[]
  }
  expectType<TypeEqual<typeof result, typeof expected>>(true)
})
